import { Request, Response, NextFunction } from 'express';
import TenantAllocationService from '../services/TenantAllocationService';

export default class TenantAllocationController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await TenantAllocationService.createAllocation({
        ...req.body,
        createdById: (req as any).user.id
      });
      res.status(201).json({ success: true, data: allocation });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const allocations = await TenantAllocationService.getAllAllocations();
      res.json({ success: true, data: allocations });
    } catch (err) {
      next(err);
    }
  }

  static async getTenantByPropertyId(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.query;
      const allocations = await TenantAllocationService.getByPropertyId(propertyId as string);
      res.json({ success: true, data: allocations });
    } catch (err) {
      next(err);
    }
  }

  static async getAllocationById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const allocation = await TenantAllocationService.getAllocationById(id as string);
      if (!allocation) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      res.json({ success: true, data: allocation });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const allocation = await TenantAllocationService.updateAllocation(id, req.body);
      if (!allocation) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      res.json({ success: true, data: allocation });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const allocation = await TenantAllocationService.deleteAllocation(id);
      if (!allocation) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      res.json({ success: true, message: "Allocation deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
