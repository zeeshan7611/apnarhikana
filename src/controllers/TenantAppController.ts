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
}
