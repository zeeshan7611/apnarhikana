import { Request, Response, NextFunction } from 'express';
import RbacService from '../services/RbacService';

export default class RbacController {
  static async getAllRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await RbacService.getAllRoles();
      res.json({ success: true, data: roles });
    } catch (err) {
      next(err);
    }
  }

  static async getAllPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await RbacService.getAllPermissions();
      res.json({ success: true, data: permissions });
    } catch (err) {
      next(err);
    }
  }

  static async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await RbacService.createRole(req.body);
      res.status(201).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  static async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const role = await RbacService.getRoleById(id as string);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const role = await RbacService.updateRole(id, req.body);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json({ success: true, data: role });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const role = await RbacService.deleteRole(id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json({ success: true, message: "Role deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  static async assignRoleToUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, roleIds } = req.body;
      const user = await RbacService.assignRoleToUser(userId, roleIds);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  static async bindPermissionToRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { featureId, actions, roleId } = req.body;
      const role = await RbacService.bindPermissionToRole(featureId, actions, roleId);
      res.json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }
}
