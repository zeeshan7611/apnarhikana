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

  static async searchTenants(
    q: string,
    propertyId?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: ITenant[]; total: number }> {
    const skip = (page - 1) * limit;
    const regex = new RegExp(q, 'i');

    const query: any = {
      $or: [{ fullName: regex }, { phoneNumber: regex }],
    };

    if (propertyId) {
      const allocations = await TenantAllocation.find({ propertyId }).select('tenantId').lean();
      const tenantIds = allocations.map((a) => a.tenantId);
      query._id = { $in: tenantIds };
    }

    const [data, total] = await Promise.all([
      Tenant.find(query)
        .select('fullName phoneNumber email profileImage joiningDate kyc.status')
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit),
      Tenant.countDocuments(query),
    ]);

    return { data, total };
  }

  // ─── KYC Methods ────────────────────────────────────────────────────────
  static async getKYCDetails(
    limit: number,
    skip: number,
    propertyId?: string[],
    status?: string,
  ): Promise<{ data: any[]; total: number }> {
    const query: any = {};

    if (status) {
      query["kyc.status"] = status;
    }

    // Filter tenants by property
    if (propertyId && propertyId.length > 0) {
      const allocations = await TenantAllocation.find({
        propertyId: { $in: propertyId },
      }).select("tenantId");

      const tenantIds = allocations.map((a) => a.tenantId);

      query._id = { $in: tenantIds };
    }

    // Fetch tenants
    const [tenants, total] = await Promise.all([
      Tenant.find(query)
        .select("fullName phoneNumber email kyc _id")
        .skip(skip)
        .limit(limit)
        .lean(),

      Tenant.countDocuments(query),
    ]);

    const tenantIds = tenants.map((t) => t._id);

    // Fetch allocations with property & room details
    const allocations = await TenantAllocation.find({
      tenantId: { $in: tenantIds },
      status: "active",
    })
      .populate("propertyId", "name")
      .populate("roomId", "name")
      .lean();

    // Merge allocation data into tenant response
    const allocationMap = new Map();

    allocations.forEach((allocation: any) => {
      allocationMap.set(allocation.tenantId.toString(), allocation);
    });

    const finalData = tenants.map((tenant: any) => {
      const allocation: any = allocationMap.get(tenant._id.toString());

      return {
        ...tenant,

        property: allocation?.propertyId
          ? {
              _id: allocation.propertyId._id,
              propertyName: allocation.propertyId.name,
            }
          : null,

        room: allocation?.roomId
          ? {
              _id: allocation.roomId._id,
              roomName:
                allocation.roomId.name || allocation.roomId.roomNumber,
            }
          : null,
      };
    });

    return {
      data: finalData,
      total,
    };
  }

  static async approveOrRejectKYC(
    tenantId: string,
    action: "approve" | "reject",
    rejectionReason?: string,
  ): Promise<ITenant | null> {
    if (action !== "approve" && action !== "reject") {
      throw new Error('Action must be either "approve" or "reject"');
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return null;

    const updateData: any = {};

    if (action === "approve") {
      updateData["kyc.status"] = "approved";
      await TenantAllocation.findOneAndUpdate(
        { tenantId, status: "active" },
        { status: "notice" },
      );
    } else {
      // Status: Uploaded => Pending
      updateData["kyc.status"] = "pending";
      if (rejectionReason) {
        updateData["kyc.rejectionReason"] = rejectionReason;
      }

      // Note : In the reject case we have to remove the images from R2Storage as well
      const { deleteFileFromUrl } = await import("./R2Service");
      const docUrls = [
        tenant.kyc?.adharCard?.adharCardFront,
        tenant.kyc?.adharCard?.adharCardBack,
        tenant.kyc?.panCard?.panCardFront,
        tenant.kyc?.drivingLicence?.drivingLicenceFront,
        tenant.kyc?.drivingLicence?.drivingLicenceBack,
        tenant.kyc?.otherDocument?.documentUrl,
      ].filter((url) => url) as string[];

      for (const url of docUrls) {
        await deleteFileFromUrl(url);
      }

      // Clear the files in the DB since they are removed from R2
      updateData["kyc.adharCard"] = undefined;
      updateData["kyc.panCard"] = undefined;
      updateData["kyc.drivingLicence"] = undefined;
      updateData["kyc.otherDocument"] = undefined;
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(tenantId, updateData, {
      new: true,
    }).populate("createdById", "name email");

    // Notification Flow: When landlord reject or approve “Tenant App” get notification.
    if (updatedTenant) {
      try {
        const NotificationService = (await import("./NotificationService")).default;
        const { NotificationType, NotificationScreen } = await import("./NotificationService");

        const title = action === "approve" ? "KYC Approved" : "KYC Rejected";
        const message =
          action === "approve"
            ? "Your KYC documents have been successfully approved by the landlord!"
            : `Your KYC was rejected. Reason: ${rejectionReason || "Please re-submit your documents."}`;

        await NotificationService.notifyTenant(
          tenantId,
          title,
          message,
          NotificationType.KYC,
          { screen: NotificationScreen.TENANT_KYC, status: updatedTenant.kyc?.status },
        );
      } catch (notifyErr) {
        console.error("Failed to notify tenant of KYC update:", notifyErr);
      }
    }

    return updatedTenant;
  }

 static async getTenantKYC(tenantId: string): Promise<any | null> {

  // Fetch tenant
  const tenant: any = await Tenant.findById(tenantId)
    .select("fullName phoneNumber email kyc _id ")
    .lean();

  if (!tenant) {
    return null;
  }

  // Fetch active allocation with property & room
  const allocation: any = await TenantAllocation.findOne({
    tenantId : tenantId,
    status: "active",
  }) 
    .lean();
console.log("Allocation in getTenantKYC:", allocation);
  return {
    ...tenant,
    property: allocation?.propertyId
      ? {
          _id: allocation.propertyId._id,
          propertyName: allocation.propertyId.name,
        }
      : null,

    room: allocation?.roomId
      ? {
          _id: allocation.roomId._id,
          roomName:
            allocation.roomId.name ||
            allocation.roomId.keyNumber,
        }
      : null,
  };
}
}
