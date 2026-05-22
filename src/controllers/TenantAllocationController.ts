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

  static async createCompleteAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const result = await TenantAllocationService.createCompleteAllocation(
        req.body,
        userId
      );

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async getVacantInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.query;
      const data = await TenantAllocationService.getVacantInventory(propertyId as string);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data, total } = await TenantAllocationService.getAllAllocations(page, limit);
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

  static async getTenantByPropertyId(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { data, total } = await TenantAllocationService.getByPropertyId(propertyId as string, page, limit);
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

  static async initiateExit(req: Request, res: Response, next: NextFunction) {
    try {
      const { allocationId, exitDate } = req.body;
      if (!allocationId || !exitDate) {
        return res.status(400).json({ message: "allocationId and exitDate are required" });
      }
      const propertyUserId = (req as any).user?.id;
      const allocation = await TenantAllocationService.initiateExit(allocationId, exitDate, propertyUserId, 'landlord');
      res.json({ success: true, data: allocation, message: "Exit initiated successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async getMoveOutList(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { propertyId, moveOutStatus } = req.query;

      const result = await TenantAllocationService.getMoveOutList({
        propertyId: propertyId as string,
        moveOutStatus: moveOutStatus as string,
        page,
        limit,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async getMoveOutDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: 'id is required' });

      const allocation = await TenantAllocationService.getMoveOutDetail(id as string);
      if (!allocation) return res.status(404).json({ success: false, message: 'Move-out request not found' });

      res.json({ success: true, data: allocation });
    } catch (err) {
      next(err);
    }
  }

  static async approveMoveOut(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ success: false, message: 'id is required' });

      const allocation = await TenantAllocationService.approveMoveOut(id);
      res.json({ success: true, data: allocation, message: 'Move-out approved successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async rejectMoveOut(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, reason } = req.body;
      if (!id) return res.status(400).json({ success: false, message: 'id is required' });

      const allocation = await TenantAllocationService.rejectMoveOut(id, reason);
      res.json({ success: true, data: allocation, message: 'Move-out rejected' });
    } catch (err) {
      next(err);
    }
  }
}
