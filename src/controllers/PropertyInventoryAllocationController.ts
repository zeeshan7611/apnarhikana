import { Request, Response, NextFunction } from "express";
import InventoryService from "../services/propertyInventoryAllocation";

export default class PropertyInventoryAllocationController {
  static async createAllocation(req: Request, res: Response, next: NextFunction) {
    try {
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
      const data = await InventoryService.getById(req.params.id);
      if (!data) {
        return res.status(404).json({ message: "Inventory not found" });
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.update(
        req.params.id,
        req.body
      );
      if (!data) {
        return res.status(404).json({ message: "Inventory not found" });
      }
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await InventoryService.delete(req.params.id);
      if (!data) {
        return res.status(404).json({ message: "Inventory not found" });
      }
      res.json({ success: true, message: "Deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}