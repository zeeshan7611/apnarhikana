import { generateToken } from "../middleware/jwtAuth";
import PropertyUser, { IPropertyUser } from "../models/PropertyUser";
import bcrypt from "bcryptjs";

export default class PropertyUserService {
  // ✅ Create User
  static async createUser(data: {
    name: string;
    email: string;
    password: string;
    roleIds?: string[];
    phoneNumber?: string;
    education?: string;
    designation?: string;
    joiningDate?: Date;
    monthlySalary?: number;
    kycDocument?: {
      adharCard?: string;
      panCard?: string;
      drivingLicense?: string;
    };
    isActive?: boolean;
  }): Promise<IPropertyUser> {
    const existing = await PropertyUser.findOne({ email: data.email });
    if (existing) {
      throw new Error("User already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return PropertyUser.create({
      ...data,
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
      phoneNumber: string;
      education: string;
      designation: string;
      joiningDate: Date;
      monthlySalary: number;
      kycDocument: {
        adharCard: string;
        panCard: string;
        drivingLicense: string;
      };
      isActive: boolean;
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
    const user = await PropertyUser
      .findOne({ email })
      .select("+passwordHash")
      .populate("roleIds");

    if (!user || !user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken({
      id: user._id,
      email: user.email,
      roles: user.roleIds
    });

    const { passwordHash, ...userObj } = user.toObject();
    return { ...userObj, token };
  }
}