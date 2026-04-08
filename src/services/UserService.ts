import User, { IUser } from '../models/User';

class UserService {
  async getUserByClerkId(clerkId: string): Promise<IUser | null> {
    return User.findOne({ clerkId });
  }

  async updateUserRoles(clerkId: string, roles: string[]): Promise<IUser | null> {
    return User.findOneAndUpdate({ clerkId }, { roles }, { new: true });
  }

  async createUser(clerkId: string, email: string, roles: string[] = ['user']): Promise<IUser> {
    const user = new User({ clerkId, email, roles });
    return user.save();
  }
}

export default new UserService();