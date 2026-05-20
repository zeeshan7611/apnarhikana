import mongoose from 'mongoose';
import Tenant, { ITenant } from '../models/Tenant';
import TenantAllocation, { ITenantAllocation } from '../models/TenantAllocation';
import RentLedger, { IRentLedger } from '../models/RentLedger';
import Complaint, { IComplaint } from '../models/Complaint';
import Announcement, { IAnnouncement } from '../models/Announcement';
import PaymentTransaction from '../models/PaymentTransaction';
import Property from '../models/Property';
import Notification, { INotification } from '../models/Notification';
import { generateToken } from '../middleware/jwtAuth';

export default class TenantAppService {
  // ✅ 1. Send OTP
  static async sendOTP(phoneNumber: string): Promise<{ message: string; otp: string }> {
    const tenant = await Tenant.findOne({ phoneNumber });
    if (!tenant) throw new Error('Tenant not found with this mobile number');

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
    if (!tenant) throw new Error('Tenant not found');

    if (!tenant.otp || tenant.otp !== otp) throw new Error('Invalid OTP');
    if (!tenant.otpExpiry || tenant.otpExpiry < new Date()) throw new Error('OTP expired');

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
    if (!allocation) throw new Error('No active allocation found');

    const ledgers = await RentLedger.find({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      status: { $in: ['pending', 'partial', 'overdue', 'due'] }
    }).sort({ month: 1 });

    const response: any[] = [];

    // Helper to calculate installments
    const getInstallments = (title: string, amount: number, type: string, ledgerId?: string, dueDate?: Date) => {
      if (amount <= 9999) return [{ title, amount, type, rentLedgerId: ledgerId, dueDate }];

      const count = Math.ceil(amount / 10000);
      const installmentAmount = Math.round(amount / count);
      const installments = [];
      for (let i = 1; i <= count; i++) {
        installments.push({
          title: `${title} (Part ${i}/${count})`,
          amount: i === count ? amount - (installmentAmount * (count - 1)) : installmentAmount,
          type,
          rentLedgerId: ledgerId,
          dueDate,

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
    const remainingDeposit = Math.max(0, allocation.depositAmount - totalDepositPaid);

    if (remainingDeposit > 0) {
      // For deposit, we use allocation startDate as the due date
      response.push(...getInstallments('Security Deposit', remainingDeposit, 'deposit', undefined, allocation.startDate));
    }

    // 2. Process Ledgers — include itemized extra charges (without double-counting)
    for (const ledger of ledgers) {
      let remaining = ledger.pendingAmount || 0;

      // If there are extra charges on the ledger, push them as separate items up to the remaining amount
      if (ledger.extraCharges && ledger.extraCharges.length > 0) {
        for (const charge of ledger.extraCharges) {
          if (remaining <= 0) break;
          const chargePending = Math.min(charge.amount || 0, remaining);
          if (chargePending > 0) {
            response.push({
              title: charge.title || `Extra: ${charge.type}`,
              amount: chargePending,
              type: 'extra_charge',
              rentLedgerId: ledger._id.toString(),
              dueDate: ledger.dueDate,
              extraType: charge.type
            });
            remaining -= chargePending;
          }
        }
      }

      // Remaining amount (after accounting for extra charges) belongs to rent — split into installments if needed
      if (remaining > 0) {
        response.push(...getInstallments(`Rent - ${ledger.month}`, remaining, 'rent', ledger._id.toString(), ledger.dueDate));
      }
    }

    return response;
  }

  // ✅ 3a. Get Specific Ledger Detail
  static async getRentLedgerById(tenantId: string, ledgerId: string): Promise<any> {
    const ledger = await RentLedger.findOne({ _id: ledgerId, tenantId })
      .populate('propertyId', 'name address contacts');
    if (!ledger) throw new Error('Ledger not found or access denied');
    return ledger;
  }

  // ✅ 4. Create Complaint (delegates to Complaint model)
  static async createComplaint(tenantId: string, data: any): Promise<IComplaint> {
    const activeAllocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });
    if (!activeAllocation) throw new Error('No active allocation found for tenant');

    return Complaint.create({
      ...data,
      tenantId,
      propertyId: activeAllocation.propertyId,
    });
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
  ): Promise<{ complaints: IComplaint[]; total: number }> {
    const skip = (page - 1) * limit;

    const query: any = { tenantId };
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;

    const [complaints, total] = await Promise.all([
      Complaint.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Complaint.countDocuments(query)
    ]);
    return { complaints, total };
  }

  // ✅ 8. Get Payment Transaction History (Tenant Wise with Pagination)
  static async getTransactionHistory(
    tenantId: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<{ transactions: any[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: any = { tenantId: new mongoose.Types.ObjectId(tenantId), status: { $in: ['partial', 'paid', 'overdue', 'due'] } };
    if (status) query.status = status;

    console.log(`[DEBUG] Fetching transactions for tenant ${tenantId}, status: ${status || 'all'}`);

    const [transactions, total] = await Promise.all([
      PaymentTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('rentLedgerId', 'month totalAmount'),
      PaymentTransaction.countDocuments(query)
    ]);

    console.log(`[DEBUG] Found ${transactions.length} transactions (Total: ${total})`);
    return { transactions, total };
  }

  // ✅ 8a. Get Single Transaction Detail
  static async getTransactionById(tenantId: string, transactionId: string): Promise<any> {
    const transaction = await PaymentTransaction.findOne({ _id: transactionId, tenantId })
      .populate('propertyId', 'name address');
    if (!transaction) throw new Error('Transaction not found or access denied');
    return transaction;
  }

  // ✅ 9. Get Property Contact Details
  static async getPropertyContactDetails(propertyId: string): Promise<any> {
    const property = await Property.findById(propertyId).select('contacts name address');
    if (!property) throw new Error('Property not found');
    return property;
  }

  // ✅ 10. Get Notifications (Tenant Wise with Pagination)
  static async getNotifications(tenantId: string, page: number = 1, limit: number = 10): Promise<{ notifications: INotification[]; total: number }> {
    const skip = (page - 1) * limit;

    // Get active allocation to check property-wide notifications
    const allocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });

    const query = {
      $or: [
        { tenantId },
        { propertyId: allocation?.propertyId },
        { tenantId: { $exists: false }, propertyId: { $exists: false } } // Global notifications
      ]
    };

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
    if (!user) throw new Error('Property Manager not found');

    // Resolve propertyId
    let propertyId = '';
    const isDeposit = data.paymentType === 'deposit';
    if (isDeposit) {
      const TenantAllocation = (await import('../models/TenantAllocation')).default;
      const allocation = await TenantAllocation.findOne({ tenantId: data.tenantId, status: { $in: ['active', 'notice'] } });
      if (!allocation) throw new Error('No active allocation found');
      propertyId = allocation.propertyId.toString();
    } else {
      if (!data.rentLedgerId) throw new Error('rentLedgerId is required');
      const ledger = await RentLedger.findOne({ _id: data.rentLedgerId, tenantId: data.tenantId });
      if (!ledger) throw new Error('Rent ledger not found or access denied');
      propertyId = ledger.propertyId.toString();
    }

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
      notes: data.notes || `Cash payment submitted by tenant to manager ${user.name}`,
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
        const { NotificationType } = await import('./NotificationService');

        const activeAllocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });
        const propertyId = activeAllocation?.propertyId?.toString();
        if (propertyId) {
          await NotificationService.notifyManagers(
            propertyId,
            'KYC Document Uploaded',
            `Tenant ${updatedTenant.fullName} has uploaded KYC documents.`,
            NotificationType.KYC,
            { tenantId: updatedTenant._id }
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
    if (!allocation) throw new Error('No active allocation found for this tenant');

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
    if (!updatedTenant) throw new Error('Tenant not found');
    return updatedTenant;
  }
}
