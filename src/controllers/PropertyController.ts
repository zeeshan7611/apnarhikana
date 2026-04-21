import { Request, Response, NextFunction } from "express";
import PropertyService from "../services/PropertyService";

export default class PropertyController {
  static async createProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const property = await PropertyService.createProperty(req.body);
      res.status(201).json({ success: true, data: property });
    } catch (error) {
      next(error);
    }
  }

  static async getAllProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const properties = await PropertyService.getAllProperties();
      res.json({ success: true, data: properties });
    } catch (error) {
      next(error);
    }
  }

  static async getPropertyById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const property = await PropertyService.getPropertyById(id as string);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ success: true, data: property });
    } catch (error) {
      next(error);
    }
  }

  static async updateProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const property = await PropertyService.updateProperty(
        id,
        req.body
      );
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ success: true, data: property });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const property = await PropertyService.deleteProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ success: true, message: "Property deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async getOccupancy(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.query;
      const stats = await PropertyService.getOccupancyStats(propertyId as string);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}