import Complaint, { IComplaint } from '../models/Complaint';
import TenantAllocation from '../models/TenantAllocation';
import NotificationService, { NotificationType } from './NotificationService';

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
    
    const complaint = await Complaint.create(data);

    // Notify tenant
    if (complaint.tenantId) {
      await NotificationService.notifyTenant(
        complaint.tenantId.toString(),
        'Complaint Created',
        `Your complaint "${complaint.title}" has been registered.`,
        NotificationType.COMPLAINT,
        { complaintId: complaint._id }
      );
    }

    return complaint;
  }

  static async getAllComplaints(filters: any = {}, page: number = 1, limit: number = 10): Promise<{ data: IComplaint[], total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Complaint.find(filters)
        .populate('tenantId', 'fullName phoneNumber')
        .populate('propertyId', 'name')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Complaint.countDocuments(filters)
    ]);
    return { data, total };
  }

  static async getComplaintById(id: string): Promise<IComplaint | null> {
    return Complaint.findById(id)
      .populate('tenantId', 'fullName phoneNumber')
      .populate('propertyId', 'name')
      .populate('assignedTo', 'name');
  }

  static async updateComplaint(id: string, data: any): Promise<IComplaint | null> {
    const complaint = await Complaint.findByIdAndUpdate(id, data, { new: true });
    
    if (complaint && data.status && complaint.tenantId) {
      await NotificationService.notifyTenant(
        complaint.tenantId.toString(),
        'Complaint Update',
        `Status of your complaint "${complaint.title}" has been updated to ${complaint.status}.`,
        NotificationType.COMPLAINT,
        { complaintId: complaint._id, status: complaint.status }
      );
    }

    return complaint;
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
