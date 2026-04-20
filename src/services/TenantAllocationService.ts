import TenantAllocation, { ITenantAllocation } from '../models/TenantAllocation';

export default class TenantAllocationService {
  static async createAllocation(data: any): Promise<ITenantAllocation> {
    return TenantAllocation.create(data);
  }

  static async getAllAllocations(): Promise<ITenantAllocation[]> {
    return TenantAllocation.find()
      .populate('tenantId')
      .populate({
        path: 'inventoryAllocationId',
        populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId']
      })
      .populate('createdById', 'name email')
      .sort({ createdAt: -1 });
  }

  static async getAllocationById(id: string): Promise<ITenantAllocation | null> {
    return TenantAllocation.findById(id)
      .populate('tenantId')
      .populate({
        path: 'inventoryAllocationId',
        populate: ['propertyId', 'floorId', 'roomId', 'bedId', 'roomCategoryId']
      })
      .populate('createdById', 'name email');
  }

  static async updateAllocation(id: string, data: any): Promise<ITenantAllocation | null> {
    return TenantAllocation.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteAllocation(id: string): Promise<ITenantAllocation | null> {
    return TenantAllocation.findByIdAndDelete(id);
  }
}
