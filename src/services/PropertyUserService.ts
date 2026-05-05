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
    propertyId?: string[];
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
      propertyId: data.propertyId || [],
    });
  }

  // ✅ Get all users (with roles and properties) with pagination
  static async getAllUsers(page: number = 1, limit: number = 10): Promise<{ data: IPropertyUser[], total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      PropertyUser.find()
        .populate("roleIds")
        .populate("propertyId", "name id")
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PropertyUser.countDocuments()
    ]);
    return { data, total };
  }

  // ✅ Get user by ID
  static async getUserById(id: string): Promise<IPropertyUser> {
    const user = await PropertyUser.findById(id)
      .populate("roleIds")
      .populate("propertyId", "name id")
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
      propertyId: string[];
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
      .populate("propertyId", "name id")
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

  // ✅ Get users by propertyId
  static async getUsersByPropertyId(propertyId: string): Promise<IPropertyUser[]> {
    return PropertyUser.find({ propertyId: propertyId })
      .populate("roleIds")
      .populate("propertyId", "name id")
      .select("-passwordHash")
      .sort({ createdAt: -1 });
  }

  static async login(email: string, password: string) {
    const user = await PropertyUser
      .findOne({ email })
      .select("+passwordHash")
      .populate("roleIds")
      .populate("propertyId", "name id");

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
      roles: user.roleIds,
      properties: user.propertyId
    });

    const { passwordHash, ...userObj } = user.toObject();
    return { ...userObj, token };
  }
}