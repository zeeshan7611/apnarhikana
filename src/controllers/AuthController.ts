import { Request, Response } from 'express';
import User from '../models/PropertyUser';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/jwtAuth';
import RbacService from '../services/RbacService';

export default class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      await RbacService.ensureDefaults();
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email already registered' });
      const hashed = await bcrypt.hash(password, 10);
      const totalUsers = await User.countDocuments();
      const defaultRole = totalUsers === 0 ? 'admin' : 'user';
      const [defaultRoleId] = await RbacService.getRoleIdsByNames([defaultRole]);
      const user = await User.create({ name, email, passwordHash: hashed, roleIds: [defaultRoleId] });
      const token = generateToken({ id: user._id, email: user.email });
      const populatedUser = await User.findById(user._id)
        .populate({
          path: 'roleIds',
          populate: { path: 'permissionIds', model: 'Permission' },
        })
        .populate('propertyId', 'name id');
      res.status(201).json({ token, user: populatedUser });
    } catch (e: any) {
      res.status(500).json({ error: e.message || e });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      await RbacService.ensureDefaults();
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+passwordHash');
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
      const token = generateToken({ id: user._id, email: user.email });
      const populatedUser = await User.findById(user._id)
        .populate({
          path: 'roleIds',
          populate: { path: 'permissionIds', model: 'Permission' },
        })
        .populate('propertyId', 'name id');
      res.json({ token, user: populatedUser });
    } catch (e: any) {
      res.status(500).json({ error: e.message || e });
    }
  }
}
