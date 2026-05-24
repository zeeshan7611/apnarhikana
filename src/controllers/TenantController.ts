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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const name = req.query.name as string | undefined;
      const status = req.query.status as string | undefined;
      const propertyId = req.query.propertyId as string | undefined;

      const allowedStatuses = ['active', 'notice', 'upcoming', 'exited'];
      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `status must be one of: ${allowedStatuses.join(', ')}` });
      }

      const { data, total } = await TenantService.getAllTenants(page, limit, name, status, propertyId);
      res.json({ 
        success: true, 
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const tenant = await TenantService.getTenantById(id as string);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json({ success: true, data: tenant });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const tenant = await TenantService.updateTenant(id, req.body);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json({ success: true, data: tenant });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const tenant = await TenantService.deleteTenant(id);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json({ success: true, message: "Tenant deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  // POST /kyc-details
  static async getKYCDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, status, page: bodyPage, limit: bodyLimit } = req.body;
      const page = parseInt((req.query.page || bodyPage) as string) || 1;
      const limit = parseInt((req.query.limit || bodyLimit) as string) || 10;
      const skip = (page - 1) * limit;
      const statusFilter = status || (req.query.status as string);

      let propertyIds: string[] | undefined;
      if (propertyId) {
        propertyIds = Array.isArray(propertyId) ? propertyId : [propertyId];
      }

      const { data, total } = await TenantService.getKYCDetails(limit, skip, propertyIds, statusFilter);
      res.json({ 
        success: true, 
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /approve-or-reject-kyc
  static async approveOrRejectKYC(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, action, rejectionReason } = req.body;
      if (!tenantId) {
        return res.status(400).json({ success: false, message: 'tenantId is required' });
      }
      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ success: false, message: 'action must be either "approve" or "reject"' });
      }

      const tenant = await TenantService.approveOrRejectKYC(tenantId, action, rejectionReason);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      res.json({
        success: true,
        message: `KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        data: tenant.kyc
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-tenant-kyc
  static async getTenantKYC(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req.query.tenantId as string) || (req.body.tenantId as string);
      if (!tenantId) {
        return res.status(400).json({ success: false, message: 'tenantId is required' });
      }

      const tenant = await TenantService.getTenantKYC(tenantId);
      if (!tenant) {
        return res.status(404).json({ success: false, message: 'Tenant not found' });
      }

      res.json({
        success: true,
        data: tenant
      });
    } catch (err) {
      next(err);
    }
  }

  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, propertyId } = req.query;
      if (!q || (q as string).trim() === '') {
        return res.status(400).json({ success: false, message: 'q (search query) is required' });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { data, total } = await TenantService.searchTenants(
        (q as string).trim(),
        propertyId as string | undefined,
        page,
        limit,
      );

      res.json({
        success: true,
        data,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
}
