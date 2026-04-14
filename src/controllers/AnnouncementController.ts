import { Request, Response, NextFunction } from 'express';
import AnnouncementService from '../services/AnnouncementService';

export default class AnnouncementController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const announcement = await AnnouncementService.createAnnouncement({
        ...req.body,
        sentBy: (req as any).user.id
      });
      res.status(201).json({ success: true, data: announcement });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, type } = req.query;
      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (type) filters.type = type;

      const announcements = await AnnouncementService.getAllAnnouncements(filters);
      res.json({ success: true, data: announcements });
    } catch (err) {
      next(err);
    }
  }
}
