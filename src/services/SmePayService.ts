import axios from 'axios';

/**
 * Service for SmePay Payment Gateway Integration
 * Flow: Authenticate → Create Order → Initiate Payment → Check Status
 */
export default class SmePayService {
  private static CLIENT_ID = process.env.SMEPAY_CLIENT_ID || '';
  private static CLIENT_SECRET = process.env.SMEPAY_CLIENT_SECRET || '';
  private static BASE_URL = process.env.SMEPAY_BASE_URL;

  // Token cache - auto refreshes before expiry
  private static cachedToken: string | null = null;
  private static tokenExpiresAt: number = 0;

  /**
   * 1. Authenticate
   * POST {{baseUrl}}/api/external/auth
   * Token expires in 600 seconds (10 min). Refreshes 30s early to be safe.
   */
  private static async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 30s buffer)
    if (this.cachedToken && this.tokenExpiresAt > now + 30000) {
      return this.cachedToken;
    }

    try {
      const response = await axios.post(`${this.BASE_URL}/api/external/auth`, {
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { access_token, expires_in } = response.data;
      this.cachedToken = access_token;
      this.tokenExpiresAt = now + (expires_in * 1000);

      console.log(`SmePay Auth: Token acquired (expires in ${expires_in}s, env: ${response.data.environment})`);
      return access_token;
    } catch (error: any) {
      console.error('SmePay Auth Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to authenticate with SmePay');
    }
  }

  /**
   * Returns headers with a fresh Bearer token
   */
  private static async getHeaders() {
    const token = await this.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * 2. Create Order
   * POST {{baseUrl}}/api/external/order/create
   */
  static async createOrder(orderData: {
    order_id: string;
    amount: string;
    customer_details: {
      email: string;
      mobile: string;
      name: string;
    };
    callback_url?: string;
  }) {
    try {
      const payload = {
        client_id: this.CLIENT_ID,
        amount: orderData.amount,
        order_id: orderData.order_id,
        callback_url: orderData.callback_url || `${process.env.APP_URL}/api/tenant-app/payment-webhook`,
        customer_details: orderData.customer_details
      };

      console.log('SmePay Create Order Payload:', payload);

      const headers = await this.getHeaders();
      const response = await axios.post(`${this.BASE_URL}/api/external/order/create`, payload, { headers });

      console.log('SmePay Create Order Response:', JSON.stringify(response.data, null, 2));
      return response.data; // { status, order_id, slug, message }
    } catch (error: any) {
      console.error('SmePay Create Order Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create SmePay order');
    }
  }

  /**
   * 3. Initiate Payment
   * POST {{baseUrl}}/api/external/order/initiate
   */
  static async initiatePayment(slug: string) {
    try {
      const payload = {
        slug,
        client_id: this.CLIENT_ID
      };

      const headers = await this.getHeaders();
      const response = await axios.post(`${this.BASE_URL}/api/external/order/initiate`, payload, { headers });

      return response.data;
    } catch (error: any) {
      console.error('SmePay Initiate Payment Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initiate SmePay payment');
    }
  }

  /**
   * 4. Check Status (no auth required per docs)
   * POST {{baseUrl}}/api/external/qr/status
   */
  static async checkStatus(slug: string, ref_id: string) {
    try {
      const payload = {
        client_id: this.CLIENT_ID,
        slug,
        ref_id
      };

      const response = await axios.post(`${this.BASE_URL}/api/external/qr/status`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error: any) {
      console.error('SmePay Check Status Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to check SmePay status');
    }
  }
}
