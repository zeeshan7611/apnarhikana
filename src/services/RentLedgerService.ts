import mongoose from 'mongoose';
import RentLedger, { IRentLedger, IExtraChargeItem } from '../models/RentLedger';
import PaymentTransaction, { IPaymentTransaction } from '../models/PaymentTransaction';

export default class RentLedgerService {

  /**
   * Helper method to recalculate financial totals and status for a ledger
   * Ensures consistency across the domain.
   */
  static async recalculateLedger(ledgerId: string): Promise<IRentLedger | null> {
    const ledger = await RentLedger.findById(ledgerId);
    if (!ledger) return null;

    // 1. Calculate extra charges total
    ledger.extraChargesAmount = ledger.extraCharges.reduce((sum, item) => sum + item.amount, 0);

    // 2. Calculate total amount
    ledger.totalAmount = ledger.rentAmount + ledger.extraChargesAmount;

    // 3. Calculate paid amount from approved transactions
    const approvedPayments = await PaymentTransaction.find({
      rentLedgerId: ledger._id,
      status: 'paid'
    });
    ledger.paidAmount = approvedPayments.reduce((sum, p) => sum + p.amount, 0);

    // 4. Calculate pending amount
    ledger.pendingAmount = Math.max(0, ledger.totalAmount - ledger.paidAmount);

    // 5. Update status based on strict business rules
    const now = new Date();
    if (ledger.pendingAmount <= 0) {
      ledger.status = 'paid';
    } else if (ledger.paidAmount > 0) {
      ledger.status = 'partial';
    } else if (ledger.dueDate < now) {
      ledger.status = 'overdue';
    } else {
      ledger.status = 'due';
    }

    return ledger.save();
  }

  // ─── 1. Create Ledger ───────────────────────────────────────────────────────
  static async createLedger(data: {
    tenantId: string;
    propertyId: string;
    tenantAllocationId: string;
    month: string;
    rentAmount: number;
    dueDate: Date;
  }): Promise<IRentLedger> {
    const ledger = await RentLedger.create({
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      tenantAllocationId: data.tenantAllocationId,
      month: data.month,
      rentAmount: data.rentAmount,
      totalAmount: data.rentAmount, // Initial total is just rent
      pendingAmount: data.rentAmount,
      dueDate: data.dueDate,
      status: 'pending',
      isLocked: false
    });

    return ledger;
  }

  // ─── 2. Add Extra Charge ───────────────────────────────────────────────────
  static async addExtraCharge(data: {
    rentLedgerId: string;
    title: string;
    amount: number;
    type?: 'electricity' | 'water' | 'maintenance' | 'other';
    description?: string;
    performedById: string;
  }): Promise<IRentLedger> {
    const ledger = await RentLedger.findById(data.rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');
    if (ledger.isLocked) throw new Error('Ledger is locked');

    ledger.extraCharges.push({
      title: data.title,
      type: data.type || 'other',
      amount: data.amount,
      description: data.description,
      createdAt: new Date()
    });

    await ledger.save();

    // Recalculate totals
    const updatedLedger = await this.recalculateLedger(data.rentLedgerId);
    if (!updatedLedger) throw new Error('Failed to update ledger after adding charge');

    return updatedLedger;
  }

  // ─── 3. Remove Extra Charge ─────────────────────────────────────────────────
  static async removeExtraCharge(rentLedgerId: string, chargeId: string): Promise<IRentLedger> {
    const ledger = await RentLedger.findById(rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');
    if (ledger.isLocked) throw new Error('Ledger is locked');

    const chargeIndex = (ledger.extraCharges as any).findIndex((c: any) => c._id.toString() === chargeId);
    if (chargeIndex === -1) throw new Error('Extra charge not found');

    ledger.extraCharges.splice(chargeIndex, 1);
    await ledger.save();

    const updatedLedger = await this.recalculateLedger(rentLedgerId);
    if (!updatedLedger) throw new Error('Failed to update ledger after removing charge');

    return updatedLedger;
  }

  // ─── 4. Record Payment Transaction ──────────────────────────────────────────
  static async recordPayment(data: {
    rentLedgerId?: string;       // optional for deposit payments
    tenantId: string;
    propertyId: string;
    amount: number;
    paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
    referenceNumber?: string;
    utrNumber?: string;
    paymentScreenshotUrl?: string;
    notes?: string;
    status?: 'pending' | 'partial' | 'paid' | 'overdue' | 'due' | 'initiated' | 'rejected';
    paymentType?: 'rent' | 'deposit' | 'extra_charge';
    createdById?: string;
  }): Promise<{ ledger: IRentLedger | null; transaction: IPaymentTransaction }> {
    const isDeposit = (data.paymentType === 'deposit');

    let ledger: IRentLedger | null = null;
    if (!isDeposit) {
      if (!data.rentLedgerId) throw new Error('rentLedgerId is required for rent payments');
      ledger = await RentLedger.findById(data.rentLedgerId);
      if (!ledger) throw new Error('Rent ledger not found');
      if (ledger.isLocked) throw new Error('Ledger is locked');
    }

    const status = data.status || 'pending';

    const transaction = await PaymentTransaction.create({
      ...(data.rentLedgerId ? { rentLedgerId: data.rentLedgerId } : {}),
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      status: status,
      paymentType: data.paymentType || 'rent',
      referenceNumber: data.referenceNumber,
      utrNumber: data.utrNumber,
      paymentScreenshotUrl: data.paymentScreenshotUrl,
      notes: data.notes,
      paidAt: new Date(),
      createdById: data.createdById
    });

    // Recalculate ledger only for rent payments
    if (!isDeposit && data.rentLedgerId) {
      ledger = await this.recalculateLedger(data.rentLedgerId);
      if (!ledger) throw new Error('Failed to update ledger after recording payment');
    }

    return { ledger, transaction };
  }

  // ─── 4a. Collect Rent (Direct) ──────────────────────────────────────────────
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
    status?: 'pending' | 'partial' | 'paid' | 'overdue' | 'due' | 'initiated' | 'rejected';
  }): Promise<{ ledger: IRentLedger | null; transaction: IPaymentTransaction }> {
    const ledger = await RentLedger.findOne({
      tenantId: data.tenantId,
      month: data.month
    });

    if (!ledger) throw new Error('Rent ledger not found for the specified month');

    return this.recordPayment({
      rentLedgerId: ledger._id.toString(),
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      utrNumber: data.utrNumber,
      paymentScreenshotUrl: data.paymentScreenshotUrl,
      notes: data.notes,
      status: data.status || 'paid',
      createdById: data.createdById
    });
  }

  // ─── 5. Process Cash Payment Request (Approve / Reject) ──────────────────────
  static async processCashPaymentRequest(transactionId: string, action: 'approve' | 'reject'): Promise<{ ledger: IRentLedger | null; transaction: IPaymentTransaction }> {
    const transaction = await PaymentTransaction.findById(transactionId);
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status !== 'pending' && transaction.status !== 'initiated') {
      throw new Error('Only pending or initiated transactions can be processed');
    }

    if (action === 'approve') {
      transaction.status = 'paid';
    } else {
      transaction.status = 'rejected';
    }
    await transaction.save();

    // Recalculate ledger if associated
    let ledger: IRentLedger | null = null;
    if (transaction.rentLedgerId) {
      ledger = await this.recalculateLedger(transaction.rentLedgerId.toString());
    }

    // Trigger Notification to Tenant
    try {
      const NotificationService = (await import('./NotificationService')).default;
      const { NotificationType, NotificationScreen } = await import('./NotificationService');
      const amountStr = `₹${transaction.amount}`;
      const paymentTypeStr = transaction.paymentType === 'deposit' ? 'Security Deposit' : 'Rent/Charges';
      if (action === 'approve') {
        await NotificationService.notifyTenant(
          transaction.tenantId.toString(),
          'Cash Payment Approved',
          `Your cash payment of ${amountStr} for ${paymentTypeStr} has been successfully approved by the manager.`,
          NotificationType.PAYMENT,
          { screen: NotificationScreen.TENANT_TRANSACTION_DETAIL, transactionId: transaction._id.toString(), status: 'paid' }
        );
      } else {
        await NotificationService.notifyTenant(
          transaction.tenantId.toString(),
          'Cash Payment Rejected',
          `Your cash payment of ${amountStr} for ${paymentTypeStr} was rejected by the manager. Please contact them.`,
          NotificationType.PAYMENT,
          { screen: NotificationScreen.TENANT_TRANSACTION_DETAIL, transactionId: transaction._id.toString(), status: 'rejected' }
        );
      }
    } catch (notificationErr) {
      console.error('Failed to send cash payment action notification:', notificationErr);
    }

    return { ledger, transaction };
  }

  // ─── 6b. Complete Payment (Gateway/Webhook) ─────────────────────────────────
  static async completePayment(transactionId: string): Promise<{ ledger: IRentLedger | null; transaction: IPaymentTransaction }> {
    const transaction = await PaymentTransaction.findById(transactionId);
    if (!transaction) throw new Error('Transaction not found');

    transaction.status = 'paid';
    await transaction.save();

    // Only recalculate ledger for rent payments
    let ledger: IRentLedger | null = null;
    if (transaction.rentLedgerId) {
      ledger = await this.recalculateLedger(transaction.rentLedgerId.toString());
    }

    // Notify landlord managers: rent/deposit paid online
    try {
      const NotificationService = (await import('./NotificationService')).default;
      const { NotificationType, NotificationScreen } = await import('./NotificationService');
      const paymentTypeStr = transaction.paymentType === 'deposit' ? 'Security Deposit' : 'Rent';
      await NotificationService.notifyManagers(
        transaction.propertyId.toString(),
        'Payment Received',
        `${paymentTypeStr} payment of ₹${transaction.amount} has been received via UPI.`,
        NotificationType.PAYMENT,
        { screen: NotificationScreen.LANDLORD_TRANSACTION_DETAIL, transactionId: transaction._id.toString(), tenantId: transaction.tenantId.toString() }
      );
    } catch (notificationErr) {
      console.error('Failed to send payment complete notification to managers:', notificationErr);
    }

    return { ledger, transaction };
  }

  // ─── 6a. Get Single Ledger ────────────────────────────────────────────────────
  static async getLedgerById(id: string): Promise<IRentLedger> {
    const ledger = await RentLedger.findById(id)
      .populate('tenantId', 'fullName phoneNumber')
      .populate('propertyId', 'name')
      .populate('tenantAllocationId');
    if (!ledger) throw new Error('Rent ledger not found');
    return ledger;
  }

  // ─── 7. Get Ledgers ─────────────────────────────────────────────────────────
  static async getLedgers(filters: {
    tenantId?: string;
    propertyId?: string;
    month?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: IRentLedger[], total: number }> {
    const query: any = {};
    if (filters.tenantId) query.tenantId = filters.tenantId;
    if (filters.propertyId) query.propertyId = filters.propertyId;
    if (filters.month) query.month = filters.month;
    if (filters.status) query.status = filters.status;

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      RentLedger.find(query)
        .populate('tenantId', 'fullName phoneNumber')
        .populate('propertyId', 'name')
        .populate('tenantAllocationId')
        .sort({ month: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RentLedger.countDocuments(query)
    ]);

    return { data, total };
  }

  // ─── 8. Get Payment History ────────────────────────────────────────────────
  static async getPaymentHistory(filters: {
    propertyId?: string;
    tenantId?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: IPaymentTransaction[], total: number }> {
    const query: any = { status: 'paid' };
    if (filters.propertyId) query.propertyId = filters.propertyId;
    if (filters.tenantId) query.tenantId = filters.tenantId;

    if (filters.from || filters.to) {
      query.paidAt = {};
      if (filters.from) query.paidAt.$gte = new Date(filters.from);
      if (filters.to) query.paidAt.$lte = new Date(filters.to);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      PaymentTransaction.find(query)
        .populate('tenantId', 'fullName phoneNumber email')
        .populate('rentLedgerId', 'month totalAmount paidAmount rentAmount')
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PaymentTransaction.countDocuments(query)
    ]);

    return { data, total };
  }

  // ─── 8a. Get Property Transactions ─────────────────────────────────────────
  static async getPropertyTransactions(filters: {
    propertyId?: string;
    tenantId?: string;
    status?: string;
    paymentType?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: IPaymentTransaction[]; total: number }> {
    const query: any = { status: 'paid' };
    if (filters.propertyId) query.propertyId = new mongoose.Types.ObjectId(filters.propertyId);
    if (filters.tenantId) query.tenantId = new mongoose.Types.ObjectId(filters.tenantId);
    if (filters.paymentType) query.paymentType = filters.paymentType;

    if (filters.from || filters.to) {
      query.paidAt = {};
      if (filters.from) query.paidAt.$gte = new Date(filters.from);
      if (filters.to) query.paidAt.$lte = new Date(filters.to);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      PaymentTransaction.find(query)
        .populate('tenantId', 'fullName phoneNumber email')
        .populate('rentLedgerId', 'month totalAmount paidAmount rentAmount')
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PaymentTransaction.countDocuments(query)
    ]);

    return { data, total };
  }

  // ─── 8c. Get Recent Transactions ───────────────────────────────────────────
  static async getRecentTransactions(limit: number = 5): Promise<IPaymentTransaction[]> {
    return PaymentTransaction.find({ status: 'paid' })
      .populate('tenantId', 'fullName phoneNumber email')
      .populate('rentLedgerId', 'month totalAmount paidAmount rentAmount')
      .populate('propertyId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  // ─── 8d. Get Single Transaction ──────────────────────────────────────────────
  static async getTransactionById(id: string): Promise<IPaymentTransaction> {
    const transaction = await PaymentTransaction.findOne({ _id: id, status: 'paid' })
      .populate('tenantId', 'fullName phoneNumber email')
      .populate('rentLedgerId', 'month totalAmount paidAmount rentAmount')
      .populate('propertyId', 'name');
    if (!transaction) throw new Error('Transaction not found or not paid');
    return transaction;
  }


  // ─── 9. Generate Monthly Ledgers ───────────────────────────────────────────
  static async generateMonthlyLedgers(performedById: string, targetMonth?: string): Promise<{ created: number; skipped: number }> {
    const TenantAllocation = (await import('../models/TenantAllocation')).default;
    const now = new Date();
    const month = targetMonth ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [y, m] = month.split('-').map(Number);
    const dueDate = new Date(y, m, 5); // 5th of next month

    const activeAllocations = await TenantAllocation.find({ status: { $in: ['active', 'notice'] } });
    let created = 0;
    let skipped = 0;

    for (const alloc of activeAllocations) {
      const startMonth = `${alloc.startDate.getFullYear()}-${String(alloc.startDate.getMonth() + 1).padStart(2, '0')}`;
      if (startMonth > month) {
        skipped++;
        continue;
      }

      try {
        await RentLedger.create({
          tenantId: alloc.tenantId,
          propertyId: alloc.propertyId,
          tenantAllocationId: alloc._id,
          month,
          rentAmount: alloc.rentAmount,
          totalAmount: alloc.rentAmount,
          pendingAmount: alloc.rentAmount,
          dueDate,
          status: 'pending',
          isLocked: false
        });
        created++;
      } catch (err: any) {
        if (err.code === 11000) skipped++;
        else throw err;
      }
    }

    return { created, skipped };
  }

  // ─── 9a. Generate Initial Ledgers (on allocation) ───────────────────────────
  static async generateInitialLedgers(allocationId: string, createdById: string): Promise<number> {
    const TenantAllocation = (await import('../models/TenantAllocation')).default;
    const alloc = await TenantAllocation.findById(allocationId);
    if (!alloc) throw new Error('Tenant allocation not found');

    const startDate = new Date(alloc.startDate);
    const now = new Date();
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = current > currentMonth ? current : currentMonth;

    let createdCount = 0;
    while (current <= end) {
      const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const dueDate = new Date(current.getFullYear(), current.getMonth() + 1, 5);
      try {
        await RentLedger.create({
          tenantId: alloc.tenantId,
          propertyId: alloc.propertyId,
          tenantAllocationId: alloc._id,
          month: monthStr,
          rentAmount: alloc.rentAmount,
          totalAmount: alloc.rentAmount,
          pendingAmount: alloc.rentAmount,
          dueDate,
          status: 'pending',
          isLocked: false
        });
        createdCount++;
      } catch (err: any) {
        if (err.code !== 11000) throw err;
      }
      current.setMonth(current.getMonth() + 1);
    }
    return createdCount;
  }

  // ─── 10. Get Current Month Revenue ──────────────────────────────────────────
  static async getCurrentMonthRevenue(propertyId?: string): Promise<{ totalRevenue: number; transactionCount: number }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const query: any = {
      status: 'paid',
      paidAt: { $gte: startOfMonth, $lte: endOfMonth }
    };

    if (propertyId) {
      query.propertyId = new mongoose.Types.ObjectId(propertyId);
    }

    const stats = await PaymentTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    return stats[0] || { totalRevenue: 0, transactionCount: 0 };
  }

  // ─── 11. Get Pending Payment & Due Stats ───────────────────────────────────
  static async getPendingPaymentStats(propertyId?: string): Promise<{
    pendingTransactionsCount: number;
    pendingTransactionsAmount: number;
    totalDueAmount: number;
  }> {
    const transactionQuery: any = { status: 'pending' };
    const ledgerQuery: any = { status: { $in: ['pending', 'partial', 'overdue'] } };

    if (propertyId) {
      transactionQuery.propertyId = new mongoose.Types.ObjectId(propertyId);
      ledgerQuery.propertyId = new mongoose.Types.ObjectId(propertyId);
    }

    const transactionStats = await PaymentTransaction.aggregate([
      { $match: transactionQuery },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: "$amount" }
        }
      }
    ]);

    const ledgerStats = await RentLedger.aggregate([
      { $match: ledgerQuery },
      {
        $group: {
          _id: null,
          due: { $sum: "$pendingAmount" }
        }
      }
    ]);

    const tStat = transactionStats[0] || { count: 0, amount: 0 };
    const lStat = ledgerStats[0] || { due: 0 };

    return {
      pendingTransactionsCount: tStat.count,
      pendingTransactionsAmount: tStat.amount,
      totalDueAmount: lStat.due
    };
  }

  // ─── 12. Cancel Tenant Ledgers ──────────────────────────────────────────────
  static async cancelTenantLedgers(tenantId: string, performedById: string, currentMonth?: string): Promise<number> {
    const now = new Date();
    const month = currentMonth ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const result = await RentLedger.deleteMany({
      tenantId,
      status: 'pending',
      month: { $gt: month },
      isLocked: false
    });

    return result.deletedCount || 0;
  }

  // ─── 13. Sync All Ledgers ──────────────────────────────────────────────────
  static async syncAllLedgers(performedById: string): Promise<{ totalAllocations: number; ledgersCreated: number }> {
    const TenantAllocation = (await import('../models/TenantAllocation')).default;
    const activeAllocations = await TenantAllocation.find({ status: { $in: ['active', 'notice'] } });

    let ledgersCreated = 0;
    for (const alloc of activeAllocations) {
      // For each allocation, ensure ledgers exist from start date to now
      const startDate = new Date(alloc.startDate);
      const now = new Date();
      let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

      while (current <= now) {
        const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const dueDate = new Date(current.getFullYear(), current.getMonth() + 1, 5);

        try {
          await RentLedger.create({
            tenantId: alloc.tenantId,
            propertyId: alloc.propertyId,
            tenantAllocationId: alloc._id,
            month: monthStr,
            rentAmount: alloc.rentAmount,
            totalAmount: alloc.rentAmount,
            pendingAmount: alloc.rentAmount,
            dueDate,
            status: 'pending',
            isLocked: false
          });
          ledgersCreated++;
        } catch (err: any) {
          if (err.code !== 11000) throw err;
        }
        current.setMonth(current.getMonth() + 1);
      }
    }

    return { totalAllocations: activeAllocations.length, ledgersCreated };
  }

  static async getCashPaymentRequests(filters: {
    propertyId?: string;
    tenantId?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: IPaymentTransaction[]; total: number }> {
    const query: any = { paymentMethod: 'cash' };

    const allowedStatuses = ['initiated', 'approved', 'rejected'];
    if (filters.status && allowedStatuses.includes(filters.status)) {
      query.status = filters.status;
    } else {
      query.status = 'initiated';
    }

    if (filters.propertyId) query.propertyId = new mongoose.Types.ObjectId(filters.propertyId);
    if (filters.tenantId) query.tenantId = new mongoose.Types.ObjectId(filters.tenantId);

    if (filters.from || filters.to) {
      query.paidAt = {};
      if (filters.from) query.paidAt.$gte = new Date(filters.from);
      if (filters.to) query.paidAt.$lte = new Date(filters.to);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      PaymentTransaction.find(query)
        .populate('tenantId', 'fullName phoneNumber email')
        .populate('rentLedgerId', 'month totalAmount paidAmount rentAmount')
        .populate('propertyId', 'name')
        .populate('createdById', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PaymentTransaction.countDocuments(query)
    ]);

    return { data, total };
  }

  static async getCashPaymentRequestDetail(transactionId: string): Promise<IPaymentTransaction> {
    const transaction = await PaymentTransaction.findOne({
      _id: transactionId,
      paymentMethod: 'cash',
    })
      .populate('tenantId', 'fullName phoneNumber email')
      .populate('rentLedgerId', 'month totalAmount paidAmount rentAmount')
      .populate('propertyId', 'name')
      .populate('createdById', 'name');

    if (!transaction) throw new Error('Cash payment request not found');
    return transaction;
  }
}
