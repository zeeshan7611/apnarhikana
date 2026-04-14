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

  static async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const role = await RbacService.updateRole(id, req.body);
      res.json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }

  static async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      await RbacService.deleteRole(id);
      res.json({ success: true, message: 'Role deleted' });
    } catch (err) {
      next(err);
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
      const { featureId, action, roleId } = req.body;
      const role = await RbacService.bindPermissionToRole(featureId, action, roleId);
      res.json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  }
}
