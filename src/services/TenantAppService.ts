import mongoose from 'mongoose';
import Tenant, { ITenant } from '../models/Tenant';
import TenantAllocation, { ITenantAllocation } from '../models/TenantAllocation';
import RentLedger, { IRentLedger } from '../models/RentLedger';
import Complaint, { IComplaint } from '../models/Complaint';
import { AppError } from '../utils/AppError';
import Announcement, { IAnnouncement } from '../models/Announcement';
import PaymentTransaction from '../models/PaymentTransaction';
import Property from '../models/Property';
import Notification, { INotification } from '../models/Notification';
import { generateToken } from '../middleware/jwtAuth';

export default class TenantAppService {
  // ✅ 1. Send OTP
  static async sendOTP(phoneNumber: string): Promise<{ message: string; otp: string }> {
    const tenant = await Tenant.findOne({ phoneNumber });
    if (!tenant) throw new AppError('Tenant not found with this mobile number', 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    tenant.otp = otp;
    tenant.otpExpiry = otpExpiry;
    await tenant.save();

    // Mock sending OTP (In production, use SMS gateway)
    console.log(`OTP for ${phoneNumber}: ${otp}`);

    return { message: 'OTP sent successfully', otp }; // Returning OTP for dev/testing
  }

  // ✅ 2. Verify OTP & Login
  static async verifyOTP(phoneNumber: string, otp: string): Promise<{ tenant: ITenant; allocation: ITenantAllocation | null; token: string }> {
    const tenant = await Tenant.findOne({ phoneNumber });
    if (!tenant) throw new AppError('Tenant not found', 404);

    if (!tenant.otp || tenant.otp !== otp) throw new AppError('Invalid OTP', 400);
    if (!tenant.otpExpiry || tenant.otpExpiry < new Date()) throw new AppError('OTP expired', 400);

    // Clear OTP after verification
    tenant.otp = undefined;
    tenant.otpExpiry = undefined;
    await tenant.save();

    // Get active allocation
    const allocation = await TenantAllocation.findOne({ tenantId: tenant._id, status: { $in: ['active', 'notice'] } })
      .populate({
        path: 'inventoryAllocationId',
        populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId'],
      });

    const token = generateToken({ id: tenant._id, role: 'tenant', phoneNumber: tenant.phoneNumber });

    return { tenant, allocation, token };
  }

  // ✅ 3. Get Rent Details with Installment Breakdown
  static async getRentDetail(tenantId: string): Promise<any> {
    const allocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } }).populate('propertyId');
    if (!allocation) throw new AppError('No active allocation found', 404);

    const ledgers = await RentLedger.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      status: { $in: ['pending', 'partial', 'overdue', 'due'] }
    }).sort({ month: 1 });

    // Fetch all initiated transactions for this tenant to determine item status
    const initiatedTxns = await PaymentTransaction.find({ tenantId, status: 'initiated' as any });

    // Map of ledgerId -> total initiated amount (to assign status part-by-part)
    const initiatedAmountByLedger = new Map<string, number>();
    initiatedTxns.forEach(t => {
      if (t.rentLedgerId) {
        const key = t.rentLedgerId.toString();
        initiatedAmountByLedger.set(key, (initiatedAmountByLedger.get(key) || 0) + t.amount);
      }
    });
    const initiatedDepositAmount = initiatedTxns
      .filter(t => t.paymentType === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const now = new Date();

    const baseStatus = (dueDate: Date | undefined): string =>
      dueDate && dueDate < now ? 'overdue' : 'due';

    const response: any[] = [];

    // Splits totalAmount into installments. Paid parts are excluded from the result.
    // Only the first unpaid part can be 'initiated' — paying/initiating Part 1 never cascades to Part 2.
    const getInstallments = (
      title: string,
      totalAmount: number,
      paidAmount: number,
      type: string,
      ledgerId?: string,
      dueDate?: Date,
      isDeposit = false
    ) => {
      let paidBudget = paidAmount;
      let initiatedBudget = isDeposit
        ? initiatedDepositAmount
        : (ledgerId ? (initiatedAmountByLedger.get(ledgerId) || 0) : 0);
      let initiatedAssigned = false;

      const resolvePartStatus = (partAmount: number): string => {
        if (paidBudget >= partAmount) { paidBudget -= partAmount; return 'paid'; }
        if (!initiatedAssigned && initiatedBudget > 0) { initiatedAssigned = true; return 'initiated'; }
        return baseStatus(dueDate);
      };

      // No split needed — show only if not fully paid
      if (totalAmount <= 9999) {
        if (paidAmount >= totalAmount) return [];
        return [{ title, amount: totalAmount - paidAmount, type, rentLedgerId: ledgerId, dueDate, status: resolvePartStatus(totalAmount - paidAmount) }];
      }

      const count = Math.ceil(totalAmount / 10000);
      const installmentAmount = Math.round(totalAmount / count);
      const installments = [];
      for (let i = 1; i <= count; i++) {
        const partAmount = i === count ? totalAmount - (installmentAmount * (count - 1)) : installmentAmount;
        const status = resolvePartStatus(partAmount);
        if (status === 'paid') continue;
        installments.push({
          title: `${title} (Part ${i}/${count})`,
          amount: partAmount,
          type,
          rentLedgerId: ledgerId,
          dueDate,
          status,
        });
      }
      return installments;
    };

    // 1. Add Deposit (if applicable)
    const depositPayments = await PaymentTransaction.find({
      tenantId,
      paymentType: 'deposit',
      status: 'paid' as any
    });
    const totalDepositPaid = depositPayments.reduce((sum, p) => sum + p.amount, 0);

    if (totalDepositPaid < allocation.depositAmount) {
      response.push(...getInstallments('Security Deposit', allocation.depositAmount, totalDepositPaid, 'deposit', undefined, allocation.startDate, true));
    }

    // 2. Process Ledgers — extra charges first, then rent installments
    for (const ledger of ledgers) {
      let remaining = ledger.pendingAmount || 0;
      const ledgerId = ledger._id.toString();

      if (ledger.extraCharges && ledger.extraCharges.length > 0) {
        for (const charge of ledger.extraCharges) {
          if (remaining <= 0) break;
          const chargePending = Math.min(charge.amount || 0, remaining);
          if (chargePending > 0) {
            response.push({
              title: charge.title || `Extra: ${charge.type}`,
              amount: chargePending,
              type: 'extra_charge',
              rentLedgerId: ledgerId,
              dueDate: ledger.dueDate,
              extraType: charge.type,
              status: (initiatedAmountByLedger.get(ledgerId) || 0) > 0 ? 'initiated' : baseStatus(ledger.dueDate),
            });
            remaining -= chargePending;
          }
        }
      }

      // Use rentAmount (original) + rentPaid to show consistent part numbering
      // and mark paid parts as 'paid' instead of hiding them.
      if (ledger.rentAmount > 0) {
        const rentPaid = Math.max(0, ledger.paidAmount - ledger.extraChargesAmount);
        if (rentPaid < ledger.rentAmount) {
          response.push(...getInstallments(`Rent - ${ledger.month}`, ledger.rentAmount, rentPaid, 'rent', ledgerId, ledger.dueDate));
        }
      }
    }

    return response;
  }

  // ✅ 3a. Get Specific Ledger Detail
  static async getRentLedgerById(tenantId: string, ledgerId: string): Promise<any> {
    const ledger = await RentLedger.findOne({ _id: ledgerId, tenantId })
      .populate('propertyId', 'name address contacts');
    if (!ledger) throw new AppError('Ledger not found or access denied', 404);
    return ledger;
  }

  // ✅ 4. Create Complaint (delegates to Complaint model)
  static async createComplaint(tenantId: string, data: any): Promise<IComplaint> {
    const activeAllocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });
    if (!activeAllocation) throw new AppError('No active allocation found for tenant', 404);

    const propertyId = activeAllocation.propertyId.toString();

    const complaint = await Complaint.create({
      ...data,
      tenantId,
      propertyId,
      type: 'tenant',
      sourceApp: 'tenant',
    });

    await complaint.populate([
      { path: 'tenantId', select: 'fullName phoneNumber' },
      { path: 'propertyId', select: 'name' },
    ]);

    try {
      const NotificationService = (await import('./NotificationService')).default;
      const { NotificationType, NotificationScreen } = await import('./NotificationService');

      await NotificationService.notifyManagers(
        propertyId,
        'New Complaint Raised',
        `A new complaint "${complaint.title}" has been submitted by a tenant.`,
        NotificationType.COMPLAINT,
        { screen: NotificationScreen.LANDLORD_COMPLAINT_DETAIL, complaintId: complaint._id.toString() }
      );
    } catch (notifyErr) {
      console.error('Failed to notify managers about new complaint:', notifyErr);
    }

    return complaint;
  }

  // ✅ 5. Get Complete Allocation Detail
  static async getAllocationDetail(tenantId: string): Promise<ITenantAllocation | null> {
    return TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } })
      .populate({
        path: 'inventoryAllocationId',
        populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId'],
      })
      .populate('tenantId');
  }

  // ✅ 6. Get Recent Announcements for Property/Floor/Room
  static async getAnnouncements(tenantId: string): Promise<IAnnouncement[]> {
    const allocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });
    if (!allocation) return [];

    const query = {
      $or: [
        { tenantId },
        { propertyId: allocation.propertyId },
        { floorId: allocation.floorId },
        { roomId: allocation.roomId },
        { propertyId: { $exists: false }, floorId: { $exists: false }, roomId: { $exists: false }, tenantId: { $exists: false } } // Global announcements?
      ]
    };

    return Announcement.find(query)
      .populate('propertyId', 'name')
      .populate('sentBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
  }

  // ✅ 7. Get Complaints (Tenant Wise with Pagination)
  static async getComplaints(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    filters: { status?: string; category?: string; priority?: string } = {}
  ): Promise<{ complaints: IComplaint[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const query: any = { tenantId };
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;

    const [complaints, total] = await Promise.all([
      Complaint.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Complaint.countDocuments(query)
    ]);
    return { complaints, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ✅ 7a. Move-out Policy & Security Deposit Info
  static async getMoveOutPolicy(tenantId: string): Promise<any> {
    const allocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });
    if (!allocation) throw new AppError('No active allocation found', 404);

    // How much deposit has been paid so far
    const depositPayments = await PaymentTransaction.find({ tenantId, paymentType: 'deposit', status: 'paid' as any });
    const depositPaid = depositPayments.reduce((sum, p) => sum + p.amount, 0);
    const depositRemaining = Math.max(0, allocation.depositAmount - depositPaid);

    const NOTICE_PERIOD_DAYS = 30;

    const refundPolicy = [
      { minDays: 30, maxDays: null,  refundPercentage: 100, label: `${NOTICE_PERIOD_DAYS}+ days notice — Full refund` },
      { minDays: 22, maxDays: 29,    refundPercentage: 75,  label: '22–29 days notice — 75% refund' },
      { minDays: 15, maxDays: 21,    refundPercentage: 50,  label: '15–21 days notice — 50% refund' },
      { minDays: 8,  maxDays: 14,    refundPercentage: 25,  label: '8–14 days notice — 25% refund' },
      { minDays: 0,  maxDays: 7,     refundPercentage: 0,   label: '0–7 days notice — No refund' },
    ];

    // Current active exit notice period served days
    let noticePeriodServedDays: number | null = null;
    if (allocation.exitInitiatedAt && allocation.endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = new Date(allocation.endDate).getTime() - today.getTime();
      noticePeriodServedDays = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    }

    const result: any = {
      depositAmount: allocation.depositAmount,
      depositPaid,
      depositRemaining,
      noticePeriodDays: NOTICE_PERIOD_DAYS,
      refundPolicy,
      currentMoveOutStatus: allocation.moveOutStatus || null,
      noticePeriodServedDays,
      exitInfo: allocation.exitLog || [],
    };

    return result;
  }

  // ✅ 8. Get Payment Transaction History (Tenant Wise with Pagination)
  static async getTransactionHistory(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
    month?: string  // format: YYYY-MM
  ): Promise<{ transactions: any[]; total: number }> {
    const skip = (page - 1) * limit;
    const ALLOWED_STATUSES = ['initiated', 'paid', 'failed'];

    const query: any = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
      status: { $in: ALLOWED_STATUSES }
    };

    if (status && ALLOWED_STATUSES.includes(status)) {
      query.status = status;
    }

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);
      query.createdAt = { $gte: start, $lt: end };
    }

    const [transactions, total] = await Promise.all([
      PaymentTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('rentLedgerId', 'month totalAmount'),
      PaymentTransaction.countDocuments(query)
    ]);

    return { transactions, total };
  }

  // ✅ 8a. Get Single Transaction Detail
  static async getTransactionById(tenantId: string, transactionId: string): Promise<any> {
    const transaction = await PaymentTransaction.findOne({ _id: transactionId, tenantId })
      .populate('propertyId', 'name address')
      .populate('createdById', 'name email');
    if (!transaction) throw new AppError('Transaction not found or access denied', 404);
    return transaction;
  }

  // ✅ 9. Get Property Contact Details
  static async getPropertyContactDetails(propertyId: string): Promise<any> {
    const property = await Property.findById(propertyId).select('contacts name address');
    if (!property) throw new AppError('Property not found', 404);
    return property;
  }

  // ✅ 10. Get Notifications (Tenant Wise with Pagination)
  static async getNotifications(tenantId: string, page: number = 1, limit: number = 10): Promise<{ notifications: INotification[]; total: number }> {
    const skip = (page - 1) * limit;

    const allocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });

    const orConditions: any[] = [{ tenantId: new mongoose.Types.ObjectId(tenantId) }];
    if (allocation?.propertyId) {
      // Property-wide announcements (no tenantId set) e.g. from notifyProperty
      orConditions.push({ propertyId: allocation.propertyId, tenantId: { $exists: false } });
    }
    const query = { sourceApp: 'landlord', $or: orConditions };

    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query)
    ]);
    return { notifications, total };
  }

  // ✅ 11. Mark Notification as Read
  static async markNotificationAsRead(notificationId: string): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  }

  // ✅ 12. Update OneSignal ID
  static async updateOneSignalId(tenantId: string, oneSignalId: string): Promise<ITenant | null> {
    return Tenant.findByIdAndUpdate(tenantId, { oneSignalId }, { new: true });
  }

  // ✅ 13. Record Cash Payment (Pending approval by Manager)
  static async recordCashPayment(data: {
    tenantId: string;
    propertyUserId: string;
    rentLedgerId?: string;
    amount: number;
    notes?: string;
    paymentType?: 'rent' | 'deposit' | 'extra_charge';
  }): Promise<any> {
    const PropertyUser = (await import('../models/PropertyUser')).default;
    const user = await PropertyUser.findById(data.propertyUserId);
    if (!user) throw new AppError('Property Manager not found', 404);

    // Resolve propertyId and auto-generate part label
    let propertyId = '';
    let partLabel = '';
    const isDeposit = data.paymentType === 'deposit';
    if (isDeposit) {
      const TenantAllocation = (await import('../models/TenantAllocation')).default;
      const allocation = await TenantAllocation.findOne({ tenantId: data.tenantId, status: { $in: ['active', 'notice'] } });
      if (!allocation) throw new AppError('No active allocation found', 404);
      propertyId = allocation.propertyId.toString();

      const depositPaid = await PaymentTransaction.find({ tenantId: data.tenantId, paymentType: 'deposit', status: 'paid' as any });
      const totalDepositPaid = depositPaid.reduce((s, p) => s + p.amount, 0);
      const remainingDeposit = Math.max(0, allocation.depositAmount - totalDepositPaid);
      if (remainingDeposit > 9999) {
        const count = Math.ceil(remainingDeposit / 10000);
        const inProgress = await PaymentTransaction.countDocuments({
          tenantId: data.tenantId, paymentType: 'deposit', status: { $in: ['pending', 'initiated'] }
        });
        partLabel = `Security Deposit (Part ${inProgress + 1}/${count})`;
      } else {
        partLabel = 'Security Deposit';
      }
    } else {
      if (!data.rentLedgerId) throw new AppError('rentLedgerId is required', 400);
      const ledger = await RentLedger.findOne({ _id: data.rentLedgerId, tenantId: data.tenantId });
      if (!ledger) throw new AppError('Rent ledger not found or access denied', 404);
      propertyId = ledger.propertyId.toString();

      if (ledger.pendingAmount > 9999) {
        const count = Math.ceil(ledger.pendingAmount / 10000);
        const inProgress = await PaymentTransaction.countDocuments({
          rentLedgerId: data.rentLedgerId, status: { $in: ['pending', 'initiated'] }
        });
        partLabel = `Rent - ${ledger.month} (Part ${inProgress + 1}/${count})`;
      } else {
        partLabel = `Rent - ${ledger.month}`;
      }
    }

    const notes = data.notes
      ? `${partLabel} — ${data.notes}`
      : `${partLabel} — Cash payment submitted by tenant to manager ${user.name}`;

    // Mark as pending transaction
    const RentLedgerService = (await import('../services/RentLedgerService')).default;
    return RentLedgerService.recordPayment({
      ...(data.rentLedgerId ? { rentLedgerId: data.rentLedgerId } : {}),
      tenantId: data.tenantId,
      propertyId: propertyId,
      amount: data.amount,
      paymentMethod: 'cash',
      paymentType: data.paymentType || 'rent',
      status: 'initiated', // Initiated by tenant
      notes,
      createdById: data.propertyUserId
    });
  }

  // ✅ 15. Accept Agreement
  static async acceptAgreement(tenantId: string, version: string): Promise<any> {
    const Tenant = (await import('../models/Tenant')).default;
    return Tenant.findByIdAndUpdate(
      tenantId,
      {
        isAgreementAccepted: true,
        agreementAcceptedAt: new Date(),
        agreementVersion: version
      },
      { new: true }
    );
  }
  // ✅ 16. Update KYC Details
  static async updateKYC(tenantId: string, kycData: {
    adharCard?: {
      adharCardFront?: string;
      adharCardBack?: string;
    };
    panCard?: {
      panCardFront?: string;
    };
    drivingLicence?: {
      drivingLicenceFront?: string;
      drivingLicenceBack?: string;
    };
    otherDocument?: {
      documentUrl?: string;
    };
    docType?: string;
    submittedAt?: string;
  }): Promise<any> {
    const Tenant = (await import('../models/Tenant')).default;
    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        $set: {
          'kyc.adharCard': kycData.adharCard,
          'kyc.panCard': kycData.panCard,
          'kyc.drivingLicence': kycData.drivingLicence,
          'kyc.otherDocument': kycData.otherDocument,
          'kyc.docType': kycData.docType,
          'kyc.submittedAt': kycData.submittedAt,
          'kyc.status': 'uploaded'
        }
      },
      { new: true }
    );

    // Notification Flow: When user upload documents “Manager App” get notification.
    if (updatedTenant) {
      try {
        const TenantAllocation = (await import('../models/TenantAllocation')).default;
        const NotificationService = (await import('./NotificationService')).default;
        const { NotificationType, NotificationScreen } = await import('./NotificationService');

        const activeAllocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });
        const propertyId = activeAllocation?.propertyId?.toString();
        if (propertyId) {
          await NotificationService.notifyManagers(
            propertyId,
            'KYC Document Uploaded',
            `Tenant ${updatedTenant.fullName} has uploaded KYC documents for review.`,
            NotificationType.KYC,
            { screen: NotificationScreen.LANDLORD_KYC_DETAIL, tenantId: updatedTenant._id }
          );
        }
      } catch (notifyErr) {
        console.error('Failed to send upload notification:', notifyErr);
      }
    }

    return updatedTenant;
  }

  // ✅ 17. Get WiFi for Tenant
  static async getWiFiForTenant(tenantId: string): Promise<any> {
    const TenantAllocation = (await import('../models/TenantAllocation')).default;
    const allocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });
    if (!allocation) return { message: 'No active allocation found' };

    const WiFi = (await import('../models/WiFi')).default;
    return WiFi.findOne({ propertyId: allocation.propertyId, floorId: allocation.floorId, isActive: true });
  }

  // ✅ 18. Get Transaction History
  static async getTransactions(tenantId: string, page: number = 1, limit: number = 10): Promise<any> {
    const PaymentTransaction = (await import('../models/PaymentTransaction')).default;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      PaymentTransaction.find({ tenantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('rentLedgerId'),
      PaymentTransaction.countDocuments({ tenantId })
    ]);

    return { transactions, total };
  }

  // ✅ 19. Get Transaction Detail
  static async getTransactionDetail(id: string): Promise<any> {
    const PaymentTransaction = (await import('../models/PaymentTransaction')).default;
    return PaymentTransaction.findById(id).populate('rentLedgerId');
  }

  // ✅ 20. Get Property Users (Managers) associated with Tenant's active allocation
  static async getPropertyUsersForTenant(tenantId: string): Promise<any[]> {
    const TenantAllocation = (await import('../models/TenantAllocation')).default;
    const allocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });
    if (!allocation) throw new AppError('No active allocation found for this tenant', 404);

    const PropertyUser = (await import('../models/PropertyUser')).default;
    const users = await PropertyUser.find({
      propertyId: allocation.propertyId,
      isActive: true
    }).select('_id name designation');

    return users.map(user => ({
      ID: user._id,
      Name: user.name,
      Designation: user.designation || 'Staff'
    }));
  }

  // ✅ 21. Update Profile Details for Tenant
  static async updateProfile(tenantId: string, updateData: {
    fullName?: string;
    email?: string;
    alternateNumber?: string;
    emergencyContactNumber?: string;
    homeContactNumber?: string;
    profileImage?: string;
  }): Promise<any> {
    const Tenant = (await import('../models/Tenant')).default;
    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: updateData },
      { new: true }
    );
    if (!updatedTenant) throw new AppError('Tenant not found', 404);
    return updatedTenant;
  }
}
