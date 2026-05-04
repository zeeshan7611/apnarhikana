import Complaint, { IComplaint } from '../models/Complaint';
import TenantAllocation from '../models/TenantAllocation';

export default class ComplaintService {
  static async createComplaint(data: any): Promise<IComplaint> {
    // If propertyId not provided, try to find it from tenant's active allocation
    if (!data.propertyId && data.tenantId) {
      const activeAllocation = await TenantAllocation.findOne({ 
        tenantId: data.tenantId, 
        status: 'active' 
      }).populate({
        path: 'inventoryAllocationId',
        select: 'propertyId'
      });
      
      if (activeAllocation && activeAllocation.inventoryAllocationId) {
        data.propertyId = (activeAllocation.inventoryAllocationId as any).propertyId;
      }
    }
    
    return Complaint.create(data);
  }

  static async getAllComplaints(filters: any = {}): Promise<IComplaint[]> {
    return Complaint.find(filters)
      .populate('tenantId', 'fullName phoneNumber')
      .populate('propertyId', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
  }

  static async getComplaintById(id: string): Promise<IComplaint | null> {
    return Complaint.findById(id)
      .populate('tenantId', 'fullName phoneNumber')
      .populate('propertyId', 'name')
      .populate('assignedTo', 'name');
  }

  static async updateComplaint(id: string, data: any): Promise<IComplaint | null> {
    return Complaint.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteComplaint(id: string): Promise<IComplaint | null> {
    return Complaint.findByIdAndDelete(id);
  }

  static async getRecentComplaints(limit: number = 4): Promise<IComplaint[]> {
    return Complaint.find()
      .populate('tenantId', 'fullName phoneNumber')
      .populate('propertyId', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  static async getOpenComplaintCount(propertyId?: string): Promise<{ totalOpen: number }> {
    const query: any = { status: { $in: ['open', 'in-progress'] } };
    if (propertyId) query.propertyId = propertyId;
    const count = await Complaint.countDocuments(query);
    return { totalOpen: count };
  }
}
