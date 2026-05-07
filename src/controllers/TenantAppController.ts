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
      const { id } = req.params;
      const data = await TenantAppService.getRentLedgerById(tenantId, id);
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

      if (!rentLedgerId || !amount) {
        return res.status(400).json({ success: false, message: 'rentLedgerId and amount are required' });
      }

      // 1. Verify Ledger and Tenant
      const ledger = await RentLedger.findOne({ _id: rentLedgerId, tenantId });
      if (!ledger) return res.status(404).json({ success: false, message: 'Rent ledger not found or access denied' });

      // 2. Get Tenant Details for SmePay
      const Tenant = (await import('../models/Tenant')).default;
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) throw new Error('Tenant details not found');

      // 3. Create Pending Transaction in our DB
      const RentLedgerService = (await import('../services/RentLedgerService')).default;
      const { transaction } = await RentLedgerService.recordPayment({
        rentLedgerId,
        tenantId,
        propertyId: ledger.propertyId.toString(),
        amount,
        paymentMethod: 'upi', 
        paymentType: paymentType || 'rent',
        status: 'pending'
      });

      // 4. Create SmePay Order
      const SmePayService = (await import('../services/SmePayService')).default;
      const smePayOrder = await SmePayService.createOrder({
        transactionId: (transaction as any)._id.toString(),
        amount: amount,
        customerName: tenant.fullName,
        customerPhone: tenant.phoneNumber,
        customerEmail: tenant.email || '',
        notes: `Rent payment for ${ledger.month}`
      });

      res.status(201).json({ 
        success: true, 
        message: 'Payment link generated',
        paymentUrl: smePayOrder.paymentUrl,
        transactionId: smePayOrder.transactionId
      });
    } catch (err) {
      next(err);
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
      const { id } = req.params;
      const data = await TenantAppService.getTransactionById(tenantId, id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // GET /property-contacts/:propertyId
  static async getPropertyContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const data = await TenantAppService.getPropertyContactDetails(propertyId);
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
      const { id } = req.params;
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
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // POST /verify-cash-payment
  static async verifyCashPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).user.id;
      const { propertyUserId, otp, rentLedgerId, amount, notes } = req.body;
      if (!propertyUserId || !otp || !rentLedgerId || !amount) {
        return res.status(400).json({ message: 'propertyUserId, otp, rentLedgerId, and amount are required' });
      }
      const result = await TenantAppService.verifyCashPayment({
        tenantId,
        propertyUserId,
        otp,
        rentLedgerId,
        amount,
        notes
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
