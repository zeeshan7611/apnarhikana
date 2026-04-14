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
      res.json({ success: true, data: feature });
    } catch (err) {
      next(err);
    }
  }

  static async deleteFeature(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      await FeatureService.deleteFeature(id);
      res.json({ success: true, message: 'Feature deleted' });
    } catch (err) {
      next(err);
    }
  }
}
