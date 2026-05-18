import Tenant, { ITenant } from "../models/Tenant";
import TenantAllocation from "../models/TenantAllocation";

export default class TenantService {
  static async createTenant(data: any): Promise<ITenant> {
    return Tenant.create(data);
  }

  static async getAllTenants(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: ITenant[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Tenant.find()
        .populate("createdById", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Tenant.countDocuments(),
    ]);
    return { data, total };
  }

  static async getTenantById(id: string): Promise<ITenant | null> {
    return Tenant.findById(id).populate("createdById", "name email");
  }

  static async updateTenant(id: string, data: any): Promise<ITenant | null> {
    return Tenant.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteTenant(id: string): Promise<ITenant | null> {
    return Tenant.findByIdAndDelete(id);
  }

  // ─── KYC Methods ────────────────────────────────────────────────────────
  static async getKYCDetails(limit: number, skip: number, propertyId?: string[]): Promise<any[]> {
    var query: any = { "kyc.status": "pending" };
    if (propertyId && propertyId.length > 0) {
      query.propertyId = { $in: propertyId };
    }

    // Find all tenants and return their KYC details
    const tenants = await Tenant.find(query).select(
      "fullName phoneNumber email kyc _id",
    ).skip(skip).limit(limit).lean();

    return tenants;
  }

  static async approveOrRejectKYC(
    tenantId: string,
    action: "approve" | "reject",
    rejectionReason?: string,
  ): Promise<ITenant | null> {
    if (action !== "approve" && action !== "reject") {
      throw new Error('Action must be either "approve" or "reject"');
    }

    const updateData: any = {
      "kyc.status": action === "approve" ? "approved" : "rejected",
    };

    if (action === "reject" && rejectionReason) {
      updateData["kyc.rejectionReason"] = rejectionReason;
    }

    return Tenant.findByIdAndUpdate(tenantId, updateData, {
      new: true,
    }).populate("createdById", "name email");
  }
}
