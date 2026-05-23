import { Request, Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import mongoose from 'mongoose';

export default class NotificationController {
  // GET /api/notifications/list?propertyUserId=&page=&limit=
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyUserId } = req.query;
      if (!propertyUserId) {
        return res.status(400).json({ success: false, message: 'propertyUserId is required' });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const query = { propertyUserId: new mongoose.Types.ObjectId(propertyUserId as string) };

      const [data, total, unreadCount] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments(query),
        Notification.countDocuments({ ...query, isRead: false }),
      ]);

      res.json({
        success: true,
        data,
        unreadCount,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/notifications/mark-read
  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { notificationId } = req.body;
      if (!notificationId) {
        return res.status(400).json({ success: false, message: 'notificationId is required' });
      }

      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.json({ success: true, data: notification });
    } catch (err) {
      next(err);
    }
  }
}
