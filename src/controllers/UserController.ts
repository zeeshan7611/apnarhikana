import { Request, Response } from 'express';
import UserService from '../services/UserService';

class UserController {
  async getProfile(req: Request, res: Response) {
    try {
      const user = req.userDoc;
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateRoles(req: Request, res: Response) {
    try {
      const { clerkId, roles } = req.body;
      const user = await UserService.updateUserRoles(clerkId, roles);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new UserController();