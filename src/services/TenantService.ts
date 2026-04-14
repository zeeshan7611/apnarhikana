import Tenant, { ITenant } from '../models/Tenant';

export default class TenantService {
  static async createTenant(data: any): Promise<ITenant> {
    return Tenant.create(data);
  }

  static async getAllTenants(): Promise<ITenant[]> {
    return Tenant.find().populate('createdById', 'name email').sort({ createdAt: -1 });
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
}
