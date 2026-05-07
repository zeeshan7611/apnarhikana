import crypto from 'crypto';
import axios from 'axios';

/**
 * Service for SmePay Payment Gateway Integration
 */
export default class SmePayService {
  private static MERCHANT_ID = process.env.SMEPAY_MERCHANT_ID || 'MOCK_MERCHANT_ID';
  private static SALT = process.env.SMEPAY_SALT || 'MOCK_SALT';
  private static API_URL = process.env.SMEPAY_API_URL || 'https://api.smepay.com/v1/payment/create';

  /**
   * Generates a secure hash for SmePay request
   */
  private static generateHash(data: any): string {
    const { orderId, amount, customerPhone } = data;
    const stringToHash = `${this.MERCHANT_ID}|${orderId}|${amount}|${customerPhone}|${this.SALT}`;
    return crypto.createHash('sha256').update(stringToHash).digest('hex');
  }

  /**
   * Creates a payment order and returns the gateway response
   */
  static async createOrder(orderData: {
    transactionId: string;
    amount: number;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    notes?: string;
  }) {
    try {
      const hash = this.generateHash({
        orderId: orderData.transactionId,
        amount: orderData.amount,
        customerPhone: orderData.customerPhone
      });

      const payload = {
        merchant_id: this.MERCHANT_ID,
        order_id: orderData.transactionId,
        amount: orderData.amount,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_email: orderData.customerEmail,
        notes: orderData.notes,
        hash: hash,
        redirect_url: `${process.env.APP_URL}/api/tenant-app/payment-callback`
      };

      // In a real implementation, you would call the SmePay API here
      // For now, we return a mock payment URL and the payload
      console.log('SmePay Payload:', payload);
      
      return {
        paymentUrl: `https://secure.smepay.com/pay/${orderData.transactionId}`,
        transactionId: orderData.transactionId,
        message: 'Order created successfully'
      };
    } catch (error) {
      console.error('SmePay Order Creation Error:', error);
      throw new Error('Failed to initiate payment with SmePay');
    }
  }

  /**
   * Verifies the SmePay callback signature
   */
  static verifyCallback(params: any): boolean {
    const { order_id, amount, status, received_hash } = params;
    const expectedHash = crypto.createHash('sha256')
      .update(`${order_id}|${amount}|${status}|${this.SALT}`)
      .digest('hex');
    
    return expectedHash === received_hash;
  }
}
