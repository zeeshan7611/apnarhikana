import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/clerk-sdk-node';
import User from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userDoc?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    req.user = payload;

    // Sync user to DB if not exists
    let user = await User.findOne({ clerkId: payload.sub });
    if (!user) {
      user = new User({
        clerkId: payload.sub,
        email: payload.email || '',
        roles: ['user'],
      });
      await user.save();
    }
    req.userDoc = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userDoc || !roles.some(role => req.userDoc.roles.includes(role))) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};