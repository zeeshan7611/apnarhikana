import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/jwtAuth';

export default class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email already registered' });
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashed });
      const token = generateToken({ id: user._id, email: user.email });
      res.status(201).json({ token, user });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
      const token = generateToken({ id: user._id, email: user.email });
      res.json({ token, user });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
}
