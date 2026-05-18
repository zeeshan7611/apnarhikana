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
      const { data, total } = await TenantService.getAllTenants(page, limit);
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
      const { propertyId } = req.body;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = parseInt(req.query.skip as string) || 0;

      let propertyIds: string[] | undefined;

      const kycDetails = await TenantService.getKYCDetails(limit, skip, propertyIds);
      res.json({ 
        success: true, 
        data: kycDetails,
        total: kycDetails.length
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
}
