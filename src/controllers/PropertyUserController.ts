import { Request, Response, NextFunction } from "express";
import PropertyUserService from "../services/PropertyUserService";

export default class PropertyUserController {
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await PropertyUserService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await PropertyUserService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = (req.params.id || req.query.id || req.body.id) as string;
      const user = await PropertyUserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = (req.params.id || req.query.id || req.body.id) as string;
      const user = await PropertyUserService.updateUser(
        id,
        req.body
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = (req.params.id || req.query.id || req.body.id) as string;
      const user = await PropertyUserService.deleteUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      next(err);
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
}