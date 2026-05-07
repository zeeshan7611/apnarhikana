import * as OneSignal from '@onesignal/node-onesignal';
import dotenv from 'dotenv';
dotenv.config();

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '';
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || '';

const configuration = OneSignal.createConfiguration({
  authMethods: {
    rest_api_key: {
      tokenProvider: {
        getToken: () => ONESIGNAL_REST_API_KEY,
      },
    },
  },
});

const client = new OneSignal.DefaultApi(configuration);

export default class OneSignalService {
  /**
   * Base method to send notification using OneSignal SDK
   */
  static async sendNotification(notification: OneSignal.Notification) {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.warn('OneSignal credentials missing. Skipping notification.');
      return null;
    }

    try {
      notification.app_id = ONESIGNAL_APP_ID;
      const response = await client.createNotification(notification);
      return response;
    } catch (error: any) {
      console.error('OneSignal Notification Error:', error.body || error.message);
      return null;
    }
  }

  /**
   * Send notification to specific users using external user IDs (Tenant IDs)
   */
  static async sendToUsers(userIds: string[], title: string, message: string, options: any = {}) {
    const notification = new OneSignal.Notification();
    notification.headings = { en: title };
    notification.contents = { en: message };
    
    // In new SDK, external user IDs are handled via aliases
    notification.include_aliases = { 
      external_id: userIds 
    };
    
    Object.assign(notification, options);

    return this.sendNotification(notification);
  }

  /**
   * Send notification to all users
   */
  static async sendToAll(title: string, message: string, options: any = {}) {
    const notification = new OneSignal.Notification();
    notification.headings = { en: title };
    notification.contents = { en: message };
    notification.included_segments = ['All'];
    
    Object.assign(notification, options);

    return this.sendNotification(notification);
  }

  /**
   * Send notification based on tags
   */
  static async sendByTag(tagName: string, tagValue: string, title: string, message: string, options: any = {}) {
    const notification = new OneSignal.Notification();
    notification.headings = { en: title };
    notification.contents = { en: message };
    notification.filters = [{ field: 'tag', key: tagName, relation: '=', value: tagValue } as any];
    
    Object.assign(notification, options);

    return this.sendNotification(notification);
  }

  /**
   * Send notification to specific player IDs (Subscription IDs)
   */
  static async sendToPlayerIds(playerIds: string[], title: string, message: string, options: any = {}) {
    const notification = new OneSignal.Notification();
    notification.headings = { en: title };
    notification.contents = { en: message };
    
    // In new SDK, player_id is now called subscription_id
    notification.include_subscription_ids = playerIds;
    
    Object.assign(notification, options);

    return this.sendNotification(notification);
  }
}
