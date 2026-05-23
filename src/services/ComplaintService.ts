import Complaint, { IComplaint } from '../models/Complaint';
import TenantAllocation from '../models/TenantAllocation';
import NotificationService, { NotificationScreen, NotificationType } from './NotificationService';

export default class ComplaintService {
  static async createComplaint(data: any, creatorId?: string): Promise<IComplaint> {
    // 'self' is treated as 'propertyUser' for backward compat
    if (data.type === 'self' || data.type === 'propertyUser') {
      data.type = 'propertyUser';
      data.tenantId = null;
      data.sourceApp = data.sourceApp || 'propertyManager';
      if (creatorId) {
        data.propertyUserId = creatorId;
        data.assignedTo = creatorId;
      }
    } else {
      data.type = 'tenant';
    }

    // If propertyId not provided, try to find it from tenant's active allocation
    if (data.type !== 'self' && !data.propertyId && data.tenantId) {
      const activeAllocation = await TenantAllocation.findOne({ 
        tenantId: data.tenantId, 
        status: { $in: ['active', 'notice'] } 
      }).populate({
        path: 'inventoryAllocationId',
        select: 'propertyId'
      });
      
      if (activeAllocation && activeAllocation.inventoryAllocationId) {
        data.propertyId = (activeAllocation.inventoryAllocationId as any).propertyId;
      }
    }
    
    const complaint = await Complaint.create(data);

    if (data.type !== 'self' && complaint.tenantId) {
      // Notify tenant: complaint registered
      await NotificationService.notifyTenant(
        complaint.tenantId.toString(),
        'Complaint Created',
        `Your complaint "${complaint.title}" has been registered.`,
        NotificationType.COMPLAINT,
        { screen: NotificationScreen.TENANT_COMPLAINT_DETAIL, complaintId: complaint._id }
      );

      // Notify landlord managers: new complaint raised by tenant
      if (complaint.propertyId) {
        await NotificationService.notifyManagers(
          complaint.propertyId.toString(),
          'New Complaint Raised',
          `A new complaint "${complaint.title}" has been submitted by a tenant.`,
          NotificationType.COMPLAINT,
          { screen: NotificationScreen.LANDLORD_COMPLAINT_DETAIL, complaintId: complaint._id }
        );
      }
    }

    await complaint.populate([
      { path: 'tenantId', select: 'fullName phoneNumber' },
      { path: 'propertyUserId', select: 'name phoneNumber' },
      { path: 'propertyId', select: 'name' },
      { path: 'assignedTo', select: 'name' },
    ]);

    return complaint;
  }

  static async getAllComplaints(filters: any = {}, page: number = 1, limit: number = 10): Promise<{ data: IComplaint[], total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Complaint.find(filters)
        .populate('tenantId', 'fullName phoneNumber')
        .populate('propertyUserId', 'name phoneNumber')
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
      .populate('propertyUserId', 'name phoneNumber')
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
        { screen: NotificationScreen.TENANT_COMPLAINT_DETAIL, complaintId: complaint._id, status: complaint.status }
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
      .populate('propertyUserId', 'name phoneNumber')
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
