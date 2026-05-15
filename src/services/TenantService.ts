import Tenant, { ITenant } from '../models/Tenant';

export default class TenantService {
  static async createTenant(data: any): Promise<ITenant> {
    return Tenant.create(data);
  }

  static async getAllTenants(page: number = 1, limit: number = 10): Promise<{ data: ITenant[], total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Tenant.find().populate('createdById', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Tenant.countDocuments()
    ]);
    return { data, total };
  }

  static async getTenantById(id: string): Promise<ITenant | null> {
    return Tenant.findById(id).populate('createdById', 'name email');
  }

  static async updateTenant(id: string, data: any): Promise<ITenant | null> {
    return Tenant.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteTenant(id: string): Promise<ITenant | null> {
    return Tenant.findByIdAndDelete(id);
  }

  // ─── KYC Methods ────────────────────────────────────────────────────────
  static async getKYCDetails(propertyId: string): Promise<any[]> {
    const TenantAllocation = (await import('../models/TenantAllocation')).default;
    
    // Find all active tenant allocations for this property
    const allocations = await TenantAllocation.find({ 
      propertyId, 
      status: 'active' 
    }).select('tenantId');

    if (allocations.length === 0) {
      return [];
    }

    const tenantIds = allocations.map(alloc => alloc.tenantId);

    // Find all tenants and return their KYC details
    const tenants = await Tenant.find({ _id: { $in: tenantIds } }).select(
      'fullName phoneNumber email kyc _id'
    );

    return tenants.map(tenant => ({
      tenantId: tenant._id,
      fullName: tenant.fullName,
      phoneNumber: tenant.phoneNumber,
      email: tenant.email,
      kyc: tenant.kyc || { status: 'pending' }
    }));
  }

  static async approveOrRejectKYC(
    tenantId: string,
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<ITenant | null> {
    if (action !== 'approve' && action !== 'reject') {
      throw new Error('Action must be either "approve" or "reject"');
    }

    const updateData: any = {
      'kyc.status': action === 'approve' ? 'approved' : 'rejected'
    };

    if (action === 'reject' && rejectionReason) {
      updateData['kyc.rejectionReason'] = rejectionReason;
    }

    return Tenant.findByIdAndUpdate(
      tenantId,
      updateData,
      { new: true }
    ).populate('createdById', 'name email');
  }
}
