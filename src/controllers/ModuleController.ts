import { Request, Response, NextFunction } from 'express';
import ModuleService from '../services/ModuleService';

export default class ModuleController {
  static async createModule(req: Request, res: Response, next: NextFunction) {
    try {
      const module = await ModuleService.createModule(req.body);
      res.status(201).json({ success: true, data: module });
    } catch (err) {
      next(err);
    }
  }

  static async getAllModules(req: Request, res: Response, next: NextFunction) {
    try {
      const modules = await ModuleService.getAllModules();
      res.json({ success: true, data: modules });
    } catch (err) {
      next(err);
    }
  }

  static async updateModule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const module = await ModuleService.updateModule(id, req.body);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json({ success: true, data: module });
    } catch (error) {
      next(error);
    }
  }

  static async deleteModule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const module = await ModuleService.deleteModule(id);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json({ success: true, message: "Module deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
