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
        const allocation = await TenantAllocation.findOne({ tenantId, status: 'active' });
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
            transaction.status = 'overdue'; // or map to appropriate local status
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

  // GET /transactions
  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const data = await TenantAppService.getTransactionHistory(tenantId, page, limit, status);
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
      const { propertyUserId } = req.body;
      if (!propertyUserId) return res.status(400).json({ message: 'propertyUserId is required' });
      const result = await TenantAppService.initiateCashPayment(propertyUserId);
     return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // POST /verify-cash-payment
  static async verifyCashPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { propertyUserId, otp, rentLedgerId, amount, notes, paymentType } = req.body;
      if (!propertyUserId || !otp || !rentLedgerId || !amount) {
        return res.status(400).json({ message: 'propertyUserId, otp, rentLedgerId, and amount are required' });
      }
      const result = await TenantAppService.verifyCashPayment({
        tenantId,
        propertyUserId,
        otp,
        rentLedgerId,
        amount,
        notes,
        paymentType
      });
      res.json({ success: true, data: result });
    } catch (err) {
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
        adharCardFront, 
        adharCardBack, 
        panCard, 
        drivingLicenceFront, 
        drivingLicenceBack, 
        otherDocument 
      } = req.body;
      
      const data = await TenantAppService.updateKYC(tenantId, { 
        adharCardFront, 
        adharCardBack, 
        panCard, 
        drivingLicenceFront, 
        drivingLicenceBack, 
        otherDocument 
      });
      
      res.json({ success: true, message: 'KYC documents submitted successfully', data });
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
}
