import { Request, Response, NextFunction } from 'express';
import RoomCategoryService from '../services/RoomCategoryService';

export default class RoomCategoryController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const roomCategory = await RoomCategoryService.createRoomCategory(req.body);
      res.status(201).json({ success: true, data: roomCategory });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, isActive } = req.query;
      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const roomCategories = await RoomCategoryService.getAllRoomCategories(filters);
      res.json({ success: true, data: roomCategories });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const roomCategory = await RoomCategoryService.getRoomCategoryById(id as string);
      if (!roomCategory) {
        return res.status(404).json({ message: "Room category not found" });
      }
      res.json({ success: true, data: roomCategory });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const roomCategory = await RoomCategoryService.updateRoomCategory(id, req.body);
      if (!roomCategory) {
        return res.status(404).json({ message: "Room category not found" });
      }
      res.json({ success: true, data: roomCategory });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const roomCategory = await RoomCategoryService.deleteRoomCategory(id);
      if (!roomCategory) {
        return res.status(404).json({ message: "Room category not found" });
      }
      res.json({ success: true, message: "Room category deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async getStaticCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = RoomCategoryService.getStaticRoomCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async getByProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.query;
      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }
      const roomCategories = await RoomCategoryService.getAllRoomCategories({ propertyId });
      res.json({ success: true, data: roomCategories });
    } catch (error) {
      next(error);
    }
  }
}
