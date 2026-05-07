import RentLedgerService from './RentLedgerService';

export default class PaymentService {
  /**
   * Collect Rent directly via Manager App
   * Updates the RentLedger and records a pre-approved transaction
   */
  static async collectRent(data: {
    tenantId: string;
    propertyId: string;
    month: string;           // YYYY-MM
    amount: number;
    paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
    referenceNumber?: string;
    utrNumber?: string;
    paymentScreenshotUrl?: string;
    notes?: string;
    createdById: string;
  }) {
    // We use RentLedgerService to ensure the ledger is updated correctly
    return RentLedgerService.collectRent(data);
  }

  static async getAllPayments(filters: any = {}) {
    // Return all transactions via the unified RentLedger system
    return RentLedgerService.getAllPayments(filters.propertyId, filters.status);
  }

  static async getPaymentById(id: string) {
    const Payment = (await import('../models/Payment')).default;
    return Payment.findById(id)
      .populate('tenantId', 'fullName phoneNumber email')
      .populate('propertyId', 'name')
      .populate('rentLedgerId', 'month totalAmount paidAmount');
  }

  static async updatePayment(id: string, data: any) {
    const Payment = (await import('../models/Payment')).default;
    return Payment.findByIdAndUpdate(id, data, { new: true });
  }
}
