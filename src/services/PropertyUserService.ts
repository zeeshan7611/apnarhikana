import PropertyUser, { IPropertyUser } from "../models/PropertyUser";
import bcrypt from "bcryptjs";

export default class PropertyUserService {
  // ✅ Create User
  static async createUser(data: {
    name: string;
    email: string;
    password: string;
    roleIds?: string[];
  }): Promise<IPropertyUser> {
    const existing = await PropertyUser.findOne({ email: data.email });
    if (existing) {
      throw new Error("User already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return PropertyUser.create({
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
      roleIds: data.roleIds || [],
    });
  }

  // ✅ Get all users (with roles)
  static async getAllUsers(): Promise<IPropertyUser[]> {
    return PropertyUser.find()
      .populate("roleIds")
      .select("-passwordHash")
      .sort({ createdAt: -1 });
  }

  // ✅ Get user by ID
  static async getUserById(id: string): Promise<IPropertyUser> {
    const user = await PropertyUser.findById(id)
      .populate("roleIds")
      .select("-passwordHash");
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  // ✅ Update User
  static async updateUser(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      password: string;
      roleIds: string[];
    }>
  ): Promise<IPropertyUser> {
    const updateData: any = { ...data };

    // 🔐 If password update
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }

    const user = await PropertyUser.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("roleIds")
      .select("-passwordHash");

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // ✅ Delete User
  static async deleteUser(id: string): Promise<IPropertyUser> {
    const user = await PropertyUser.findByIdAndDelete(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  // ✅ Login (for auth)
  static async login(email: string, password: string) {
    const user = await PropertyUser.findOne({ email }).populate("roleIds");
    if (!user) throw new Error("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new Error("Invalid credentials");

    return user;
  }
}