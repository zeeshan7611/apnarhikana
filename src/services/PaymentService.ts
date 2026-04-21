import Payment, { IPayment } from '../models/Payment';

export default class PaymentService {
  static async collectRent(data: any): Promise<IPayment> {
    return Payment.create({
      ...data,
      paidAt: data.status === 'paid' ? new Date() : undefined
    });
  }

  static async getAllPayments(filters: any = {}): Promise<IPayment[]> {
    const query: any = {};
    if (filters.tenantId) query.tenantId = filters.tenantId;
    if (filters.propertyId) query.propertyId = filters.propertyId;
    if (filters.status) query.status = filters.status;
    if (filters.month) query.month = filters.month;

    return Payment.find(query)
      .populate('tenantId', 'fullName phoneNumber')
      .populate('propertyId', 'name')
      .populate('tenantAllocationId')
      .sort({ createdAt: -1 });
  }

  static async getPaymentById(id: string): Promise<IPayment | null> {
    return Payment.findById(id)
      .populate('tenantId', 'fullName phoneNumber')
      .populate('propertyId', 'name')
      .populate('tenantAllocationId');
  }

  static async updatePayment(id: string, data: any): Promise<IPayment | null> {
    const updateData = { ...data };
    if (data.status === 'paid' && !data.paidAt) {
      updateData.paidAt = new Date();
    }
    return Payment.findByIdAndUpdate(id, updateData, { new: true });
  }
}
