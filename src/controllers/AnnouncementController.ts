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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (type) filters.type = type;

      const { data, total } = await AnnouncementService.getAllAnnouncements(filters, page, limit);
      res.json({ 
        success: true, 
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
