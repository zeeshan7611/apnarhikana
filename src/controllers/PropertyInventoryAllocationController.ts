import { Request, Response, NextFunction } from "express";
import InventoryService from "../services/PropertyInventoryAllocation";

export default class PropertyInventoryAllocationController {
  static async createAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      if (Array.isArray(req.body)) {
        const data = await InventoryService.createBatchAllocations(req.body);
        return res.status(201).json({ success: true, data });
      }
      const data = await InventoryService.create(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAllAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.getAll();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAllocationById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const data = await InventoryService.getById(id as string);
      if (!data) {
        return res.status(404).json({ message: "Inventory not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const data = await InventoryService.update(
        id,
        req.body
      );
      if (!data) {
        return res.status(404).json({ message: "Inventory not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const data = await InventoryService.delete(id);
      if (!data) {
        return res.status(404).json({ message: "Inventory not found" });
      }
      res.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}