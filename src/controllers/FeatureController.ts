import { Request, Response, NextFunction } from 'express';
import FeatureService from '../services/FeatureService';

export default class FeatureController {
  static async createFeature(req: Request, res: Response, next: NextFunction) {
    try {
      const feature = await FeatureService.createFeature(req.body);
      res.status(201).json({ success: true, data: feature });
    } catch (err) {
      next(err);
    }
  }

  static async getAllFeatures(req: Request, res: Response, next: NextFunction) {
    try {
      const features = await FeatureService.getAllFeatures();
      res.json({ success: true, data: features });
    } catch (err) {
      next(err);
    }
  }

  static async updateFeature(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const feature = await FeatureService.updateFeature(id, req.body);
      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }
      res.json({ success: true, data: feature });
    } catch (error) {
      next(error);
    }
  }

  static async deleteFeature(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const feature = await FeatureService.deleteFeature(id);
      if (!feature) {
        return res.status(404).json({ message: "Feature not found" });
      }
      res.json({ success: true, message: "Feature deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
