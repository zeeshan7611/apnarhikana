import Allocation, { IAllocation } from '../models/Allocation';

class AllocationService {
  async getAllAllocations(): Promise<IAllocation[]> {
    return Allocation.find().populate('propertyId').populate('floorId').populate('roomId');
  }

  async getAllocationById(id: string): Promise<IAllocation | null> {
    return Allocation.findById(id).populate('propertyId').populate('floorId').populate('roomId');
  }

  async createAllocation(data: Partial<IAllocation>): Promise<IAllocation> {
    const allocation = new Allocation(data);
    return allocation.save();
  }

  async updateAllocation(id: string, data: Partial<IAllocation>): Promise<IAllocation | null> {
    return Allocation.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteAllocation(id: string): Promise<void> {
    await Allocation.findByIdAndDelete(id);
  }

  async getAllocationsByTenant(tenantId: string): Promise<IAllocation[]> {
    return Allocation.find({ tenantId });
  }

  async getAllocationsByRoom(roomId: string): Promise<IAllocation[]> {
    return Allocation.find({ roomId });
  }
}

export default new AllocationService();