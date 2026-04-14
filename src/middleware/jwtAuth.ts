import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/PropertyUser';
import RbacService from '../services/RbacService';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET as string;

export async function generateToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET);
}

export async function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = (decoded as any)?.id;
    const userDoc = userId
      ? await User.findById(userId).populate({
        path: 'roleIds',
        populate: { path: 'permissionIds', model: 'Permission' },
      })
      : null;
    (req as any).userDoc = userDoc;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function authorizeRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userDoc = (req as any).userDoc;
    const userRoles = new Set(((userDoc?.roleIds || []) as any[]).map((role: any) => role.name));
    const hasRole = roles.some((role) => userRoles.has(role));
    if (!hasRole) return res.status(403).json({ error: 'Forbidden: missing required role' });
    next();
  };
}

export function authorizePermissions(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any)?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const userPermissions = new Set(await RbacService.getUserPermissions(userId));
    const hasPermission = permissions.every((permission) => userPermissions.has(permission));
    if (!hasPermission) return res.status(403).json({ error: 'Forbidden: missing required permission' });
    next();
  };
}
