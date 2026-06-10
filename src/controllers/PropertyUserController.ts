import { Request, Response, NextFunction } from "express";
import PropertyUserService from "../services/PropertyUserService";

export default class PropertyUserController {
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, phoneNumber, propertyId, roleIds, designation, joiningDate } = req.body;

      if (!name) return res.status(400).json({ success: false, message: "name is required" });
      if (!email) return res.status(400).json({ success: false, message: "email is required" });
      if (!password) return res.status(400).json({ success: false, message: "password is required" });
      if (!phoneNumber) return res.status(400).json({ success: false, message: "phoneNumber is required" });
      if (!propertyId || !Array.isArray(propertyId) || propertyId.length === 0)
        return res.status(400).json({ success: false, message: "at least one propertyId is required" });
      if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0)
        return res.status(400).json({ success: false, message: "at least one roleId is required" });
      if (!designation) return res.status(400).json({ success: false, message: "designation is required" });
      if (!joiningDate) return res.status(400).json({ success: false, message: "joiningDate is required" });

      const user = await PropertyUserService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data, total } = await PropertyUserService.getAllUsers(page, limit);
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

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const user = await PropertyUserService.getUserById(id as string);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const user = await PropertyUserService.updateUser(id, req.body);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const user = await PropertyUserService.deleteUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  // ✅ Get users by propertyId
  static async getUsersByPropertyId(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.query;
      if (!propertyId) {
        return res.status(400).json({ success: false, message: "propertyId is required" });
      }
      const users = await PropertyUserService.getUsersByPropertyId(propertyId as string);
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  // ✅ Get users with 'request_access' role
  static async getRequestAccessUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await PropertyUserService.getRequestAccessUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  // 🔐 Login API
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await PropertyUserService.login(
        req.body.email,
        req.body.password
      );

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /update-notification-token
  static async updateNotificationToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const { notificationToken } = req.body;

      if (!notificationToken) {
        return res.status(400).json({ success: false, message: 'notificationToken is required' });
      }

      const PropertyUser = (await import('../models/PropertyUser')).default;
      const user = await PropertyUser.findByIdAndUpdate(
        userId,
        { notficationToken: notificationToken },
        { new: true }
      ).select('-passwordHash');

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, message: 'Notification token updated successfully', data: user });
    } catch (err) {
      next(err);
    }
  }
}