import OneSignalService from './OneSignalService';
import Notification from '../models/Notification';
import Tenant from '../models/Tenant';

export enum NotificationType {
  ANNOUNCEMENT = 'announcement',
  COMPLAINT = 'complaint',
  PAYMENT = 'payment',
  ALLOCATION = 'allocation',
  KYC = 'kyc',
}

// Screen tags consumed by both apps to navigate on notification tap
export enum NotificationScreen {
  // ── Tenant App ──────────────────────────────────────────────
  TENANT_ANNOUNCEMENT       = 'tenant_announcement',
  TENANT_RENT               = 'tenant_rent',
  TENANT_COMPLAINT_DETAIL   = 'tenant_complaint_detail',
  TENANT_TRANSACTION_DETAIL = 'tenant_transaction_detail',
  TENANT_MOVE_OUT           = 'tenant_move_out',
  TENANT_KYC                = 'tenant_kyc',

  // ── Landlord App ─────────────────────────────────────────────
  LANDLORD_COMPLAINT_DETAIL    = 'landlord_complaint_detail',
  LANDLORD_KYC_DETAIL          = 'landlord_kyc_detail',
  LANDLORD_TRANSACTION_DETAIL  = 'landlord_transaction_detail',
  LANDLORD_CASH_PAYMENT        = 'landlord_cash_payment',
  LANDLORD_NOTICE_REQUEST      = 'landlord_notice_request',
  LANDLORD_MOVE_OUT_DETAIL     = 'landlord_move_out_detail',
  LANDLORD_EXPENSE_DETAIL      = 'landlord_expense_detail',
}

export default class NotificationService {
  /**
   * Send notification to all managers of a property
   */
  static async notifyManagers(propertyId: string, title: string, message: string, type: NotificationType, data: any = {}) {
    try {
      const PropertyUser = (await import('../models/PropertyUser')).default;
      const managers = await PropertyUser.find({
        propertyId: propertyId,
        isActive: true
      }).select('_id notficationToken');

      if (!managers || managers.length === 0) return;

      const managerIds = managers.map(m => m._id.toString());

      await Notification.create({
        propertyId,
        title,
        message,
        type,
        data,
      });

      const playerIds = managers.map(m => m.notficationToken).filter(id => id) as string[];

      if (playerIds.length > 0) {
        return OneSignalService.sendToPlayerIds(playerIds, title, message, {
          data: { ...data, type },
        });
      }

      return OneSignalService.sendToUsers(managerIds, title, message, {
        data: { ...data, type },
      });
    } catch (err) {
      console.error('Failed to notify managers:', err);
    }
  }

  /**
   * Send notification to a single tenant and save to DB
   */
  static async notifyTenant(tenantId: string, title: string, message: string, type: NotificationType, data: any = {}) {
    await Notification.create({
      tenantId,
      title,
      message,
      type,
      data,
    });

    // Fetch tenant to get oneSignalId if available
    const tenant = await Tenant.findById(tenantId).select('oneSignalId');
    if (tenant?.oneSignalId) {
      return OneSignalService.sendToPlayerIds([tenant.oneSignalId], title, message, {
        data: { ...data, type },
      });
    }

    return OneSignalService.sendToUsers([tenantId], title, message, {
      data: { ...data, type },
    });
  }

  /**
   * Send notification to multiple tenants and save to DB for each
   */
  static async notifyMultipleTenants(tenantIds: string[], title: string, message: string, type: NotificationType, data: any = {}) {
    const notifications = tenantIds.map(tenantId => ({
      tenantId,
      title,
      message,
      type,
      data,
    }));

    await Notification.insertMany(notifications);

    // Fetch tenants to get oneSignalIds
    const tenants = await Tenant.find({ _id: { $in: tenantIds } }).select('oneSignalId');
    const playerIds = tenants.map(t => t.oneSignalId).filter(id => id) as string[];

    if (playerIds.length > 0) {
      return OneSignalService.sendToPlayerIds(playerIds, title, message, {
        data: { ...data, type },
      });
    }

    return OneSignalService.sendToUsers(tenantIds, title, message, {
      data: { ...data, type },
    });
  }

  /**
   * Send notification to all tenants in a specific property and save to DB
   * Note: For property-wide, we might save one record or individual ones. 
   * Saving individual ones is better for 'isRead' tracking.
   * However, for now, let's save one with propertyId if no specific tenantIds provided.
   */
  static async notifyProperty(propertyId: string, title: string, message: string, type: NotificationType, data: any = {}) {
    await Notification.create({
      propertyId,
      title,
      message,
      type,
      data,
    });

    return OneSignalService.sendByTag('propertyId', propertyId, title, message, {
      data: { ...data, type },
    });
  }

  /**
   * Send global notification and save to DB
   */
  static async notifyAll(title: string, message: string, type: NotificationType, data: any = {}) {
    await Notification.create({
      title,
      message,
      type,
      data,
    });

    return OneSignalService.sendToAll(title, message, {
      data: { ...data, type },
    });
  }

  /**
   * Send notification to property users with the request_access role for a property
   */
  static async notifyRequestAccessUsers(
    propertyId: string,
    title: string,
    message: string,
    type: NotificationType,
    data: any = {}
  ) {
    try {
      const PropertyUserService = (await import('./PropertyUserService')).default;
      const users = await PropertyUserService.getRequestAccessUsersByProperty(propertyId);
      if (!users || users.length === 0) return;

      const userIds = users.map((u) => u._id.toString());

      await Notification.create({
        propertyId,
        title,
        message,
        type,
        data,
      });

      const playerIds = users.map((u) => u.notficationToken).filter((id) => id) as string[];

      if (playerIds.length > 0) {
        return OneSignalService.sendToPlayerIds(playerIds, title, message, {
          data: { ...data, type },
        });
      }

      return OneSignalService.sendToUsers(userIds, title, message, {
        data: { ...data, type },
      });
    } catch (err) {
      console.error('Failed to notify request access users:', err);
    }
  }

  /**
   * Send notification to a single property user and save to DB
   */
  static async notifyPropertyUser(propertyUserId: string, title: string, message: string, type: NotificationType, data: any = {}) {
    try {
      const PropertyUser = (await import('../models/PropertyUser')).default;
      const user = await PropertyUser.findById(propertyUserId);
      if (!user) return;

      const propertyId = user.propertyId && user.propertyId.length > 0 ? user.propertyId[0].toString() : undefined;

      await Notification.create({
        propertyId,
        title,
        message,
        type,
        data: { ...data, propertyUserId },
      });

      if (user.notficationToken) {
        return OneSignalService.sendToPlayerIds([user.notficationToken], title, message, {
          data: { ...data, type, propertyUserId },
        });
      }

      return OneSignalService.sendToUsers([propertyUserId], title, message, {
        data: { ...data, type, propertyUserId },
      });
    } catch (err) {
      console.error('Failed to notify property user:', err);
    }
  }

  /**
   * Send Rent Reminder
   */
  static async sendRentReminder(tenantId: string, month: string, amount: number) {
    const title = 'Rent Reminder';
    const message = `Friendly reminder: Your rent for ${month} of ₹${amount} is due. Please ignore if already paid.`;
    return this.notifyTenant(tenantId, title, message, NotificationType.PAYMENT, {
      screen: NotificationScreen.TENANT_RENT,
      month,
      amount,
    });
  }
}
