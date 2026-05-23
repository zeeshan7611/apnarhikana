import { Request, Response, NextFunction } from 'express';
import TenantAppService from '../services/TenantAppService';
import RentLedger from '../models/RentLedger';

export default class TenantAppController {
  // POST /send-otp
  static async sendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) return res.status(400).json({ message: 'phoneNumber is required' });
      
      const result = await TenantAppService.sendOTP(phoneNumber);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // POST /login
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber, otp } = req.body;
      if (!phoneNumber || !otp) return res.status(400).json({ message: 'phoneNumber and otp are required' });

      const result = await TenantAppService.verifyOTP(phoneNumber, otp);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /rent-detail
  static async getRentDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const data = await TenantAppService.getRentDetail(tenantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // GET /rent-detail/:id
  static async getRentLedgerDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { id } = req.query;
      const data = await TenantAppService.getRentLedgerById(tenantId, id as string);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // POST /pay-rent (SmePay Gateway Integration)
  static async payRent(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { rentLedgerId, amount, paymentType } = req.body;

      if (!amount) {
        return res.status(400).json({ success: false, message: 'amount is required' });
      }

      const isDeposit = paymentType === 'deposit';

      // For rent payments, rentLedgerId is required
      if (!isDeposit && !rentLedgerId) {
        return res.status(400).json({ success: false, message: 'rentLedgerId is required for rent payments' });
      }

      // 1. Get Tenant Details
      const Tenant = (await import('../models/Tenant')).default;
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) throw new Error('Tenant details not found');

      let propertyId: string;

      if (isDeposit) {
        // For deposit: get propertyId from active allocation (no ledger needed)
        const TenantAllocation = (await import('../models/TenantAllocation')).default;
        const allocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });
        if (!allocation) {
          return res.status(404).json({ success: false, message: 'No active allocation found' });
        }
        propertyId = allocation.propertyId.toString();
      } else {
        // For rent: validate ledger belongs to this tenant
        const ledger = await RentLedger.findOne({ _id: rentLedgerId, tenantId });
        if (!ledger) {
          return res.status(404).json({ success: false, message: 'Rent ledger not found or access denied' });
        }
        propertyId = ledger.propertyId.toString();
      }

      // 2. Create Pending Transaction in our DB
      const RentLedgerService = (await import('../services/RentLedgerService')).default;
      const { transaction } = await RentLedgerService.recordPayment({
        ...(isDeposit ? {} : { rentLedgerId }),
        tenantId,
        propertyId,
        amount,
        paymentMethod: 'upi',
        paymentType: paymentType || (isDeposit ? 'deposit' : 'rent'),
        status: 'pending'
      });

      // 3. Create SmePay Order
      const SmePayService = (await import('../services/SmePayService')).default;
      const orderResponse = await SmePayService.createOrder({
        order_id: (transaction as any)._id.toString(),
        amount: amount.toString(),
        customer_details: {
          name: tenant.fullName,
          mobile: tenant.phoneNumber,
          email: tenant.email || 'buyer@example.com'
        }
      });

      if (!orderResponse.status) {
        throw new Error(orderResponse.message || 'Failed to create SmePay order');
      }

      // 4. Initiate Payment to get QR/Link
      const paymentResponse = await SmePayService.initiatePayment(orderResponse.order_slug);

      if (!paymentResponse.status) {
        throw new Error(paymentResponse.message || 'Failed to initiate SmePay payment');
      }

      // 5. Save Slug and Gateway Transaction ID to our DB
      const PaymentTransaction = (await import('../models/PaymentTransaction')).default;
      await PaymentTransaction.findByIdAndUpdate(transaction._id, {
        smePaySlug: orderResponse.order_slug,
        gatewayTransactionId: paymentResponse.transaction_id
      });

      res.status(201).json({
        success: true,
        message: 'Payment initiated',
        data: {
          order_id: orderResponse.order_id,
          slug: orderResponse.order_slug,
          payment_link: paymentResponse.payment_link,
          qr_code: paymentResponse.qr_code,
          intents: paymentResponse.intents,
          transaction_id: paymentResponse.transaction_id,
          transactionId: transaction._id  // use this to poll /check-payment-status
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /check-payment-status/:transactionId
  static async checkPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId } = req.query;
      const PaymentTransaction = (await import('../models/PaymentTransaction')).default;
      const transaction = await PaymentTransaction.findById(transactionId as string);
      
      if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

      // If it's still pending in our DB, we can optionally check SmePay status one more time
      if (transaction.status === 'pending' && transaction.smePaySlug) {
        const SmePayService = (await import('../services/SmePayService')).default;
        try {
          const smeStatus = await SmePayService.checkStatus(transaction.smePaySlug, transaction._id.toString());
          if (smeStatus.status && smeStatus.payment_status === 'SUCCESS') {
            const RentLedgerService = (await import('../services/RentLedgerService')).default;
            await RentLedgerService.completePayment(transaction._id.toString());
            transaction.status = 'paid';
          } else if (smeStatus.payment_status === 'FAILED' || smeStatus.payment_status === 'EXPIRED') {
            transaction.status = 'failed';
            await transaction.save();
          }
        } catch (err) {
          console.error('Check status sync error:', err);
        }
      }

      res.json({ 
        success: true, 
        status: transaction.status,
        message: transaction.status === 'paid' ? 'Payment confirmed' : 'Payment still pending'
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /payment-webhook (Public Endpoint)
  static async paymentWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { ref_id, status, transaction_id, amount } = req.body;
      
      console.log('SmePay Webhook Received:', req.body);

      const RentLedgerService = (await import('../services/RentLedgerService')).default;
      
      if (status === 'SUCCESS') {
        await RentLedgerService.completePayment(ref_id);
        console.log(`Payment successful for Transaction: ${ref_id}`);
      } else {
        console.log(`Payment ${status} for Transaction: ${ref_id}`);
      }

      res.status(200).json({ status: true, message: 'Webhook processed' });
    } catch (err) {
      console.error('Webhook processing error:', err);
      res.status(200).json({ status: false, message: 'Webhook processing failed' });
    }
  }

  // POST /complaint
  static async createComplaint(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const complaint = await TenantAppService.createComplaint(tenantId, req.body);
      res.status(201).json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }

  // GET /allocation
  static async getAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const data = await TenantAppService.getAllocationDetail(tenantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // GET /announcements
  static async getAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const data = await TenantAppService.getAnnouncements(tenantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // GET /complaints
  static async getComplaints(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { status, category, priority } = req.query;

      const data = await TenantAppService.getComplaints(tenantId, page, limit, {
        status: status as string,
        category: category as string,
        priority: priority as string,
      });
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // GET /complaint
  static async getComplaintDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: 'id is required' });

      const ComplaintService = (await import('../services/ComplaintService')).default;
      const complaint = await ComplaintService.getComplaintById(id as string);
      if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
      }

      // Security check: ensure this complaint belongs to the tenant
      if (complaint.tenantId && complaint.tenantId._id.toString() !== tenantId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }

  // GET /transactions
  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const month = req.query.month as string;  // format: YYYY-MM

      const data = await TenantAppService.getTransactionHistory(tenantId, page, limit, status, month);
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // GET /transaction-detail/:id
  static async getTransactionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { id } = req.query;
      const data = await TenantAppService.getTransactionById(tenantId, id as string);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // GET /property-contacts/:propertyId
  static async getPropertyContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.query;
      const data = await TenantAppService.getPropertyContactDetails(propertyId as string);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // GET /notifications
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await TenantAppService.getNotifications(tenantId, page, limit);
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /notifications/:id/read
  static async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const data = await TenantAppService.markNotificationAsRead(id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /update-onesignal-id
  static async updateOneSignalId(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { oneSignalId } = req.body;
      if (!oneSignalId) return res.status(400).json({ message: 'oneSignalId is required' });

      const data = await TenantAppService.updateOneSignalId(tenantId, oneSignalId);
      res.json({ success: true, message: 'OneSignal ID updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  // POST /initiate-cash-payment
  static async initiateCashPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { propertyUserId, rentLedgerId, amount, notes, paymentType } = req.body;
      if (!propertyUserId) return res.status(400).json({ message: 'propertyUserId is required' });
      if (amount === undefined || amount <= 0) return res.status(400).json({ message: 'Valid amount is required' });

      const isDeposit = paymentType === 'deposit';
      if (!isDeposit && !rentLedgerId) {
        return res.status(400).json({ message: 'rentLedgerId is required for rent or extra charge payments' });
      }

      const mongoose = await import('mongoose');
      if (!mongoose.default.Types.ObjectId.isValid(propertyUserId)) {
        return res.status(400).json({ success: false, message: 'Invalid propertyUserId format' });
      }
      if (!isDeposit && rentLedgerId && !mongoose.default.Types.ObjectId.isValid(rentLedgerId)) {
        return res.status(400).json({ success: false, message: 'Invalid rentLedgerId format' });
      }

      const result = await TenantAppService.recordCashPayment({
        tenantId,
        propertyUserId,
        rentLedgerId,
        amount,
        notes,
        paymentType
      });

      // Trigger push notification to property manager (propertyUserId) that tenant has initiated a cash payment
      try {
        const NotificationService = (await import('../services/NotificationService')).default;
        const { NotificationType, NotificationScreen } = await import('../services/NotificationService');
        const Tenant = (await import('../models/Tenant')).default;
        const tenant = await Tenant.findById(tenantId);
        if (tenant && result && result.transaction) {
          const typeStr = paymentType === 'deposit' ? 'deposit' : 'rent';
          await NotificationService.notifyPropertyUser(
            propertyUserId,
            'Cash Payment Pending Approval',
            `${tenant.fullName} has submitted a cash payment of ₹${amount} for ${typeStr} for your approval.`,
            NotificationType.PAYMENT,
            { screen: NotificationScreen.LANDLORD_CASH_PAYMENT, transactionId: result.transaction._id.toString(), tenantId }
          );
        }
      } catch (notifyErr) {
        console.error('Failed to notify manager about cash payment initiation:', notifyErr);
      }

      return res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      const knownMessages = [
        'Property Manager not found',
        'No active allocation found',
        'Rent ledger not found or access denied',
        'rentLedgerId is required',
        'Rent ledger not found',
        'Ledger is locked'
      ];
      if (err instanceof Error && knownMessages.some(msg => err.message.includes(msg))) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next(err);
    }
  }

  // POST /accept-agreement
  static async acceptAgreement(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { version } = req.body;
      if (!version) return res.status(400).json({ message: 'Agreement version is required' });

      const data = await TenantAppService.acceptAgreement(tenantId, version);
      res.json({ success: true, message: 'Agreement accepted successfully', data });
    } catch (err) {
      next(err);
    }
  }

  // POST /kyc
  static async updateKYC(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { 
        adharCard, 
        panCard, 
        drivingLicence, 
        otherDocument,
        docType,
        submittedAt
      } = req.body;
      
      const data = await TenantAppService.updateKYC(tenantId, { 
        adharCard, 
        panCard, 
        drivingLicence, 
        otherDocument,
        docType,
        submittedAt
      });
      
      res.json({ success: true, message: 'KYC documents submitted successfully', data });
    } catch (err) {
      next(err);
    }
  }

  // GET /kyc
  static async getKYC(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const Tenant = (await import('../models/Tenant')).default;
      const tenant = await Tenant.findById(tenantId).select('kyc');
      res.json({ success: true, data: tenant?.kyc || null });
    } catch (err) {
      next(err);
    }
  }

  // GET /wifi
  static async getWiFi(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const data = await TenantAppService.getWiFiForTenant(tenantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // GET /property-users
  static async getPropertyUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const data = await TenantAppService.getPropertyUsersForTenant(tenantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // PUT /update-profile
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { fullName, email, alternateNumber, emergencyContactNumber, homeContactNumber, profileImage } = req.body;

      const data = await TenantAppService.updateProfile(tenantId, {
        fullName,
        email,
        alternateNumber,
        emergencyContactNumber,
        homeContactNumber,
        profileImage
      });

      res.json({ success: true, message: 'Profile updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  // GET /profile
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const Tenant = (await import('../models/Tenant')).default;
      const tenant = await Tenant.findById(tenantId).select(
        '-otp -otpExpiry -oneSignalId -createdById'
      );
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
      res.json({ success: true, data: tenant });
    } catch (err) {
      next(err);
    }
  }

  // GET /move-out-policy
  static async getMoveOutPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const data = await TenantAppService.getMoveOutPolicy(tenantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // POST /initiate-exit
  static async initiateExit(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { exitDate } = req.body;
      if (!exitDate) {
        return res.status(400).json({ success: false, message: 'exitDate is required' });
      }

      // Find active allocation for the tenant
      const TenantAllocation = (await import('../models/TenantAllocation')).default;
      const allocation = await TenantAllocation.findOne({ tenantId, status: { $in: ['active', 'notice'] } });
      if (!allocation) {
        return res.status(404).json({ success: false, message: 'No active room allocation found' });
      }

      const TenantAllocationService = (await import('../services/TenantAllocationService')).default;
      const updatedAllocation = await TenantAllocationService.initiateExit(
        allocation._id.toString(),
        exitDate,
        undefined,
        'tenant'
      );

      try {
        const NotificationService = (await import('../services/NotificationService')).default;
        const { NotificationType, NotificationScreen } = await import('../services/NotificationService');
        const Tenant = (await import('../models/Tenant')).default;
        const tenant = await Tenant.findById(tenantId);
        if (tenant && updatedAllocation) {
          const dateStr = new Date(exitDate).toLocaleDateString();
          const title = 'Tenant Exit Scheduled';
          const message = `${tenant.fullName} has scheduled exit on ${dateStr}. Eligible refund: ${updatedAllocation.eligibleRefundPercentage}%.`;
          const notificationData = { screen: NotificationScreen.LANDLORD_NOTICE_REQUEST, allocationId: updatedAllocation._id.toString(), tenantId };

          await NotificationService.notifyRequestAccessUsers(
            updatedAllocation.propertyId.toString(),
            title,
            message,
            NotificationType.ALLOCATION,
            notificationData
          );
        }
      } catch (notifyErr) {
        console.error('Failed to notify request access users about scheduled exit:', notifyErr);
      }

      res.json({ 
        success: true, 
        message: 'Exit initiated successfully', 
        data: updatedAllocation 
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /property-policy
  static async getPropertyPolicy(req: Request, res: Response) {
    const policy = {
      notice: {
        title: 'Important Notice',
        text: 'Violation of any policy rules may result in warnings, fines, or termination of stay. For any clarifications, please contact the property management.',
      },
      sections: [
        {
          title: 'House Rules',
          type: 'bullets',
          items: [
            { text: 'Keep your room and common areas clean', allowed: true },
            { text: 'Use dustbins for waste disposal', allowed: true },
            { text: 'Treat all residents and staff with respect', allowed: true },
            { text: 'No smoking inside the premises', allowed: false },
            { text: 'No loud music after 10 PM', allowed: false },
            { text: 'No unauthorized guests overnight', allowed: false },
          ],
        },
        {
          title: 'Quiet Hours',
          type: 'text',
          content:
            'Quiet hours are from 10 PM to 7 AM daily. Please keep noise levels to a minimum during these hours. Avoid playing loud music, using washing machines, or having loud conversations in common areas.',
        },
        {
          title: 'Visitor Policy',
          type: 'text',
          content:
            'Visitors are allowed between 8 AM to 9 PM. All visitors must register at the reception with valid ID. Overnight guests require prior approval from management. Maximum 2 visitors per resident at a time.',
        },
        {
          title: 'Safety Guidelines',
          type: 'bullets',
          items: [
            { text: 'Keep your room locked when leaving', allowed: true },
            { text: 'Report any suspicious activity immediately', allowed: true },
            { text: 'Know the location of fire exits and extinguishers', allowed: true },
            { text: 'No cooking in rooms (use common kitchen only)', allowed: false },
            { text: 'No use of high-wattage electrical appliances', allowed: false },
            { text: 'Do not block fire exits or emergency routes', allowed: false },
          ],
        },
        {
          title: 'Check-in / Check-out',
          type: 'text',
          content:
            'Check-in time: 12 PM onwards. Check-out time: 11 AM. Early check-in or late check-out may be available on request (subject to availability and charges). Please ensure all dues are cleared before check-out.',
        },
        {
          title: 'Notice Period & Exit',
          type: 'text',
          content:
            'Residents must provide 30 days written notice before vacating. Security deposit will be refunded within 15 days after check-out, subject to room inspection and clearance of all dues. Deductions may apply for damages.',
        },
      ],
    };

    res.json({ success: true, data: policy });
  }
}
