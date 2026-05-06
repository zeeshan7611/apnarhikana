import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

export default class OneSignalService {
  static async sendNotification(data: {
    contents: { [key: string]: string };
    headings?: { [key: string]: string };
    include_player_ids?: string[]; // Token-based
    include_external_user_ids?: string[]; // ID-based (Tenant IDs)
    filters?: any[];
  }) {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.warn('OneSignal credentials missing. Skipping notification.');
      return null;
    }

    try {
      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        {
          app_id: ONESIGNAL_APP_ID,
          ...data,
        },
        {
          headers: {
            Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('OneSignal Notification Error:', error.response?.data || error.message);
      return null;
    }
  }

  static async sendToUsers(userIds: string[], title: string, message: string, data: any = {}) {
    return this.sendNotification({
      headings: { en: title },
      contents: { en: message },
      include_external_user_ids: userIds,
      ...data,
    });
  }

  static async sendToAll(title: string, message: string, data: any = {}) {
    return this.sendNotification({
      headings: { en: title },
      contents: { en: message },
      included_segments: ['All'],
      ...data,
    });
  }

  static async sendByTag(tagName: string, tagValue: string, title: string, message: string, data: any = {}) {
    return this.sendNotification({
      headings: { en: title },
      contents: { en: message },
      filters: [{ field: 'tag', key: tagName, relation: '=', value: tagValue }],
      ...data,
    });
  }

  static async sendToPlayerIds(playerIds: string[], title: string, message: string, data: any = {}) {
    return this.sendNotification({
      headings: { en: title },
      contents: { en: message },
      include_player_ids: playerIds,
      ...data,
    });
  }
}
