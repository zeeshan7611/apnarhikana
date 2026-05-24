import * as OneSignal from '@onesignal/node-onesignal';
import dotenv from 'dotenv';
dotenv.config();

const TENANT_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const TENANT_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

const PROPERTY_USER_APP_ID = process.env.PROPERTY_USER_ONESIGNAL_APP_ID || '';
const PROPERTY_USER_REST_API_KEY = process.env.PROPERTY_USER_ONESIGNAL_REST_API_KEY || '';

function createClient(apiKey: string): OneSignal.DefaultApi {
  const configuration = OneSignal.createConfiguration({
    authMethods: {
      rest_api_key: {
        tokenProvider: { getToken: () => apiKey },
      },
    },
  });
  return new OneSignal.DefaultApi(configuration);
}

const tenantClient = createClient(TENANT_REST_API_KEY);
const propertyUserClient = createClient(PROPERTY_USER_REST_API_KEY);

export default class OneSignalService {
  private static async send(
    client: OneSignal.DefaultApi,
    appId: string,
    apiKey: string,
    notification: OneSignal.Notification
  ) {
    if (!appId || !apiKey) {
      console.warn('OneSignal credentials missing. Skipping notification.');
      return null;
    }
    try {
      notification.app_id = appId;
      const response = await client.createNotification(notification);
      return response;
    } catch (error: any) {
      console.error('OneSignal Notification Error:', error.body || error.message);
      return null;
    }
  }

  // ── Tenant App ──────────────────────────────────────────────────

  static async sendNotification(notification: OneSignal.Notification) {
    return this.send(tenantClient, TENANT_APP_ID, TENANT_REST_API_KEY, notification);
  }

  static async sendToUsers(userIds: string[], title: string, message: string, options: any = {}) {
    const notification = new OneSignal.Notification();
    notification.headings = { en: title };
    notification.contents = { en: message };
    notification.include_aliases = { external_id: userIds };
    Object.assign(notification, options);
    return this.sendNotification(notification);
  }

  static async sendToAll(title: string, message: string, options: any = {}) {
    const notification = new OneSignal.Notification();
    notification.headings = { en: title };
    notification.contents = { en: message };
    notification.included_segments = ['All'];
    Object.assign(notification, options);
    return this.sendNotification(notification);
  }

  static async sendByTag(tagName: string, tagValue: string, title: string, message: string, options: any = {}) {
    const notification = new OneSignal.Notification();
    notification.headings = { en: title };
    notification.contents = { en: message };
    notification.filters = [{ field: 'tag', key: tagName, relation: '=', value: tagValue } as any];
    Object.assign(notification, options);
    return this.sendNotification(notification);
  }

  static async sendToPlayerIds(playerIds: string[], title: string, message: string, options: any = {}) {
    const notification = new OneSignal.Notification();
    notification.headings = { en: title };
    notification.contents = { en: message };
    notification.include_subscription_ids = playerIds;
    Object.assign(notification, options);
    return this.sendNotification(notification);
  }

  // ── Property User (Landlord) App ────────────────────────────────

  static async sendNotificationToPropertyUser(notification: OneSignal.Notification) {
    return this.send(propertyUserClient, PROPERTY_USER_APP_ID, PROPERTY_USER_REST_API_KEY, notification);
  }

  static async sendToPropertyUserPlayerIds(playerIds: string[], title: string, message: string, options: any = {}) {
    const notification = new OneSignal.Notification();
    notification.headings = { en: title };
    notification.contents = { en: message };
    notification.include_subscription_ids = playerIds;
    Object.assign(notification, options);
    return this.sendNotificationToPropertyUser(notification);
  }

  static async sendToPropertyUserExternalIds(userIds: string[], title: string, message: string, options: any = {}) {
    const notification = new OneSignal.Notification();
    notification.headings = { en: title };
    notification.contents = { en: message };
    notification.include_aliases = { external_id: userIds };
    (notification as any).target_channel = 'push';
    Object.assign(notification, options);
    return this.sendNotificationToPropertyUser(notification);
  }
}
