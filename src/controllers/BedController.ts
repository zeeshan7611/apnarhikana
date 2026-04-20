import { Request, Response, NextFunction } from "express";
import BedService from "../services/BedService";

export default class BedController {
  static async createBed(req: Request, res: Response, next: NextFunction) {
    try {
      const bed = await BedService.createBed(req.body);
      res.status(201).json({ success: true, data: bed });
    } catch (error) {
      next(error);
    }
  }

  static async getAllBeds(req: Request, res: Response, next: NextFunction) {
    try {
      const beds = await BedService.getAllBeds();
      res.json({ success: true, data: beds });
    } catch (error) {
      next(error);
    }
  }

  static async getBedById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const bed = await BedService.getBedById(id as string);
      if (!bed) {
        return res.status(404).json({ message: "Bed not found" });
      }
      res.json({ success: true, data: bed });
    } catch (error) {
      next(error);
    }
  }

  static async updateBed(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const bed = await BedService.updateBed(id, req.body);
      if (!bed) {
        return res.status(404).json({ message: "Bed not found" });
      }
      res.json({ success: true, data: bed });
    } catch (error) {
      next(error);
    }
  }

  static async deleteBed(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const bed = await BedService.deleteBed(id);
      if (!bed) {
        return res.status(404).json({ message: "Bed not found" });
      }
      res.json({ success: true, message: "Bed deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}