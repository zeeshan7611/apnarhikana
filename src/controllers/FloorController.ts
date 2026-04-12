import { Request, Response, NextFunction } from "express";
import FloorService from "../services/FloorService";

export default class FloorController {
  static async createFloor(req: Request, res: Response, next: NextFunction) {
    try {
      const floor = await FloorService.createFloor(req.body);
      res.status(201).json({ success: true, data: floor });
    } catch (error) {
      next(error);
    }
  }

  static async getAllFloors(req: Request, res: Response, next: NextFunction) {
    try {
      const floors = await FloorService.getAllFloors();
      res.json({ success: true, data: floors });
    } catch (error) {
      next(error);
    }
  }

  static async getFloorById(req: Request, res: Response, next: NextFunction) {
    try {
      const floor = await FloorService.getFloorById(req.params.id);
      if (!floor) {
        return res.status(404).json({ message: "Floor not found" });
      }
      res.json({ success: true, data: floor });
    } catch (error) {
      next(error);
    }
  }

  static async updateFloor(req: Request, res: Response, next: NextFunction) {
    try {
      const floor = await FloorService.updateFloor(req.params.id, req.body);
      if (!floor) {
        return res.status(404).json({ message: "Floor not found" });
      }
      res.json({ success: true, data: floor });
    } catch (error) {
      next(error);
    }
  }

  static async deleteFloor(req: Request, res: Response, next: NextFunction) {
    try {
      const floor = await FloorService.deleteFloor(req.params.id);
      if (!floor) {
        return res.status(404).json({ message: "Floor not found" });
      }
      res.json({ success: true, message: "Floor deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}