import { Request, Response, NextFunction } from 'express';
import TenantAppService from '../services/TenantAppService';

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
}
