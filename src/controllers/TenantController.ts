import { Request, Response, NextFunction } from 'express';
import TenantService from '../services/TenantService';

export default class TenantController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await TenantService.createTenant({
        ...req.body,
        createdById: (req as any).user.id
      });
      res.status(201).json({ success: true, data: tenant });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenants = await TenantService.getAllTenants();
      res.json({ success: true, data: tenants });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const tenant = await TenantService.getTenantById(id as string);
      res.json({ success: true, data: tenant });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const tenant = await TenantService.updateTenant(id, req.body);
      res.json({ success: true, data: tenant });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      await TenantService.deleteTenant(id);
      res.json({ success: true, message: 'Tenant deleted' });
    } catch (err) {
      next(err);
    }
  }
}
