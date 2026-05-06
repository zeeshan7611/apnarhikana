import Announcement, { IAnnouncement } from '../models/Announcement';
import NotificationService, { NotificationType } from './NotificationService';
import TenantAllocation from '../models/TenantAllocation';

export default class AnnouncementService {
  static async createAnnouncement(data: any): Promise<IAnnouncement> {
    const announcement = await Announcement.create(data);

    // Prepare OneSignal Targeting
    let targetTenantIds: string[] = [];

    if (data.tenantId) {
      targetTenantIds = [data.tenantId.toString()];
    } else if (data.roomId) {
      const allocations = await TenantAllocation.find({ status: 'active' }).populate({
        path: 'inventoryAllocationId',
        match: { roomId: data.roomId }
      });
      targetTenantIds = allocations.filter(a => a.inventoryAllocationId).map(a => a.tenantId.toString());
    } else if (data.floorId) {
      const allocations = await TenantAllocation.find({ status: 'active' }).populate({
        path: 'inventoryAllocationId',
        match: { floorId: data.floorId }
      });
      targetTenantIds = allocations.filter(a => a.inventoryAllocationId).map(a => a.tenantId.toString());
    } else if (data.propertyId) {
      const allocations = await TenantAllocation.find({ status: 'active' }).populate({
        path: 'inventoryAllocationId',
        match: { propertyId: data.propertyId }
      });
      targetTenantIds = allocations.filter(a => a.inventoryAllocationId).map(a => a.tenantId.toString());
    }

    // Send via NotificationService if targets exist
    if (targetTenantIds.length > 0) {
      await NotificationService.notifyMultipleTenants(
        targetTenantIds,
        announcement.title,
        announcement.message,
        NotificationType.ANNOUNCEMENT,
        { announcementId: announcement._id }
      );
    } else if (!data.tenantId && !data.roomId && !data.floorId && !data.propertyId) {
      // If no filters provided, send to all (Global announcement)
      await NotificationService.notifyAll(
        announcement.title,
        announcement.message,
        NotificationType.ANNOUNCEMENT,
        { announcementId: announcement._id }
      );
    }

    return announcement;
  }

  static async getAllAnnouncements(filters: any = {}, page: number = 1, limit: number = 10): Promise<{ data: IAnnouncement[], total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Announcement.find(filters)
        .populate('propertyId', 'name')
        .populate('sentBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Announcement.countDocuments(filters)
    ]);
    return { data, total };
  }
}
