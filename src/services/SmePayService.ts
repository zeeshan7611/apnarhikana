import axios from 'axios';

/**
 * Service for SmePay Payment Gateway Integration
 * Documentation provided in USER_REQUEST
 */
export default class SmePayService {
  private static CLIENT_ID = process.env.SMEPAY_CLIENT_ID || '';
  private static AUTH_TOKEN = process.env.SMEPAY_AUTH_TOKEN || '';
  private static BASE_URL = process.env.SMEPAY_BASE_URL || 'https://smepay.example.com'; // Fallback to a placeholder

  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.AUTH_TOKEN}`
    };
  }

  /**
   * 1. Create Order
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

      const response = await axios.post(`${this.BASE_URL}/api/external/order/create`, payload, {
        headers: this.getHeaders()
      });

      return response.data; // { status, order_id, slug, message }
    } catch (error: any) {
      console.error('SmePay Create Order Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create SmePay order');
    }
  }

  /**
   * 2. Initiate Payment
   * POST {{baseUrl}}/api/external/order/initiate
   */
  static async initiatePayment(slug: string) {
    try {
      const payload = {
        slug,
        client_id: this.CLIENT_ID
      };

      const response = await axios.post(`${this.BASE_URL}/api/external/order/initiate`, payload, {
        headers: this.getHeaders()
      });

      return response.data;
      /*
      {
        status, order_id, external_reference_id, provider, payment_link, 
        transaction_id, qr_code, payment_status, expires_at, intents, message
      }
      */
    } catch (error: any) {
      console.error('SmePay Initiate Payment Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initiate SmePay payment');
    }
  }

  /**
   * 3. Check Status
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
      /*
      { status, order_id, payment_status, amount, provider, created_at, processed_at }
      */
    } catch (error: any) {
      console.error('SmePay Check Status Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to check SmePay status');
    }
  }
}
