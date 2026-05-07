import mongoose from 'mongoose';
import RentLedger, { IRentLedger, IPaymentLogItem, IExtraChargeItem } from '../models/RentLedger';
import Payment, { IPayment } from '../models/Payment';

export default class RentLedgerService {

  // ─── 1. Create Ledger (monthly bill) ────────────────────────────────────────
  static async createLedger(data: {
    tenantId: string;
    propertyId: string;
    tenantAllocationId: string;
    month: string;          // YYYY-MM
    rentAmount: number;
    lateFee?: number;
    dueDate: Date;
    createdById: string;
  }): Promise<IRentLedger> {
    const lateFee = data.lateFee ?? 0;
    const totalAmount = data.rentAmount + lateFee;

    const ledger = await RentLedger.create({
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      tenantAllocationId: data.tenantAllocationId,
      month: data.month,
      rentAmount: data.rentAmount,
      lateFee,
      totalAmount,
      paidAmount: 0,
      pendingAmount: 0,
      dueDate: data.dueDate,
      status: 'pending',
      isLocked: false,
      logs: [{
        action: 'ledger_created',
        description: `Ledger created for month ${data.month}. Rent: ${data.rentAmount}, Late fee: ${lateFee}`,
        performedById: data.createdById,
      }]
    });

    return ledger;
  }

  // ─── 2. Record a Payment (partial / full) ───────────────────────────────────
  static async recordPayment(data: {
    rentLedgerId: string;
    tenantId: string;
    propertyId: string;
    amount: number;
    paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
    referenceNumber?: string;
    utrNumber?: string;
    paymentScreenshotUrl?: string;
    notes?: string;
    status?: 'pending' | 'approved';
    createdById?: string;
  }): Promise<{ ledger: IRentLedger; payment: IPayment }> {
    const ledger = await RentLedger.findById(data.rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');
    if (ledger.isLocked) throw new Error('Ledger is locked and cannot accept new payments');

    const initialStatus = data.status || 'pending';

    // Create payment record
    const payment = await Payment.create({
      rentLedgerId: ledger._id,
      tenantAllocationId: ledger.tenantAllocationId,
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      amount: data.amount,
      month: ledger.month,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      utrNumber: data.utrNumber,
      paymentScreenshotUrl: data.paymentScreenshotUrl,
      notes: data.notes,
      status: initialStatus,
      paidAt: new Date(),
      createdById: data?.createdById,
    });

    // Recalculate amounts & status
    const previousStatus = ledger.status;

    if (initialStatus === 'approved') {
      ledger.paidAmount += data.amount;
      if (ledger.paidAmount >= ledger.totalAmount) {
        ledger.paidAmount = ledger.totalAmount; // cap it
        ledger.status = 'paid';
        ledger.isLocked = true;
      } else {
        ledger.status = 'partial';
      }
    } else {
      ledger.pendingAmount += data.amount;
    }

    // Add Log
    ledger.logs.push({
      action: 'payment_recorded',
      description: `Payment of ${data.amount} recorded via ${data.paymentMethod} with status ${initialStatus}. Paid so far: ${ledger.paidAmount}/${ledger.totalAmount}, Pending: ${ledger.pendingAmount}`,
      performedById: data?.createdById as any,
      createdAt: new Date()
    });

    await ledger.save();

    return { ledger, payment };
  }

  // ─── 2x. Collect Rent (Direct via Manager) ──────────────────────────────────
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
  }): Promise<{ ledger: IRentLedger; payment: IPayment }> {
    let ledger = await RentLedger.findOne({
      tenantId: data.tenantId,
      month: data.month,
    });

    if (!ledger) {
      throw new Error(`No rent ledger found for tenant in ${data.month}. Please generate ledgers first.`);
    }

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
      status: 'approved', // Direct collection is pre-approved
      createdById: data.createdById,
    });
  }

  // ─── 2a. Approve a Pending Payment ──────────────────────────────────────────
  static async approvePayment(
    paymentId: string,
    performedById: string
  ): Promise<{ ledger: IRentLedger; payment: IPayment }> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'pending') throw new Error('Only pending payments can be approved');

    const ledger = await RentLedger.findById(payment.rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');

    const previousStatus = ledger.status;

    // Update Payment
    payment.status = 'approved';
    await payment.save();

    // Update Ledger
    ledger.pendingAmount = Math.max(0, ledger.pendingAmount - payment.amount);
    ledger.paidAmount += payment.amount;

    if (ledger.paidAmount >= ledger.totalAmount) {
      ledger.paidAmount = ledger.totalAmount; // cap
      ledger.status = 'paid';
      ledger.isLocked = true;
    } else {
      ledger.status = 'partial';
    }

    // Add Log
    ledger.logs.push({
      action: 'status_changed',
      description: `Payment of ${payment.amount} approved. Paid so far: ${ledger.paidAmount}/${ledger.totalAmount}`,
      performedById: performedById as any,
      createdAt: new Date()
    });

    await ledger.save();

    return { ledger, payment };
  }

  // ─── 2b. Reject a Pending Payment ───────────────────────────────────────────
  static async rejectPayment(
    paymentId: string,
    performedById: string,
    notes?: string
  ): Promise<{ ledger: IRentLedger; payment: IPayment }> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'pending') throw new Error('Only pending payments can be rejected');

    const ledger = await RentLedger.findById(payment.rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');

    // Update Payment
    payment.status = 'rejected';
    if (notes) payment.notes = notes;
    await payment.save();

    // Update Ledger
    ledger.pendingAmount = Math.max(0, ledger.pendingAmount - payment.amount);
    
    // Add Log
    ledger.logs.push({
      action: 'status_changed',
      description: `Payment of ${payment.amount} rejected. ${notes ? 'Reason: ' + notes : ''}`,
      performedById: performedById as any,
      createdAt: new Date()
    });

    await ledger.save();

    return { ledger, payment };
  }

  // ─── 3. Apply Late Fee ──────────────────────────────────────────────────────
  static async applyLateFee(data: {
    rentLedgerId: string;
    lateFee: number;
    performedById: string;
  }): Promise<IRentLedger> {
    const ledger = await RentLedger.findById(data.rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');
    if (ledger.isLocked) throw new Error('Ledger is locked');

    ledger.lateFee += data.lateFee;
    ledger.totalAmount += data.lateFee;

    ledger.logs.push({
      action: 'late_fee_applied',
      description: `Late fee of ${data.lateFee} applied. New total: ${ledger.totalAmount}`,
      performedById: data.performedById as any,
      createdAt: new Date()
    });

    await ledger.save();
    return ledger;
  }

  // ─── 3a. Add Extra Charge ──────────────────────────────────────────────────────
  static async addExtraCharge(data: {
    rentLedgerId: string;
    chargeType: 'electricity' | 'water' | 'maintenance' | 'other';
    amount: number;
    description: string;
    metadata?: any;
    performedById: string;
  }): Promise<{ ledger: IRentLedger; extraCharge: IExtraChargeItem }> {
    const ledger = await RentLedger.findById(data.rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');
    if (ledger.isLocked) throw new Error('Ledger is locked and cannot accept new charges');

    const extraCharge: IExtraChargeItem = {
      chargeType: data.chargeType,
      amount: data.amount,
      description: data.description,
      metadata: data.metadata,
      createdAt: new Date()
    };

    ledger.extraCharges.push(extraCharge);
    ledger.extraChargesAmount += data.amount;
    ledger.totalAmount += data.amount;

    const previousStatus = ledger.status;
    if (ledger.paidAmount < ledger.totalAmount && ledger.paidAmount > 0) {
      ledger.status = 'partial';
    } else if (ledger.paidAmount === 0 && ledger.status !== 'overdue') {
      ledger.status = 'pending';
    }

    ledger.logs.push({
      action: 'extra_charge_added',
      description: `Extra charge added: ${data.chargeType} - ${data.amount}. Total now: ${ledger.totalAmount}`,
      performedById: data.performedById as any,
      createdAt: new Date()
    });

    await ledger.save();

    return { ledger, extraCharge };
  }

  // ─── 3b. Remove Extra Charge ───────────────────────────────────────────────────
  // Note: Since extra charges are embedded, we use their index or we'd need an _id for them.
  // Mongoose automatically adds _id to subdocuments.
  static async removeExtraCharge(rentLedgerId: string, chargeId: string, performedById: string): Promise<IRentLedger> {
    const ledger = await RentLedger.findById(rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');
    if (ledger.isLocked) throw new Error('Ledger is locked');

    const chargeIndex = (ledger.extraCharges as any).findIndex((c: any) => c._id.toString() === chargeId);
    if (chargeIndex === -1) throw new Error('Extra charge not found');

    const charge = ledger.extraCharges[chargeIndex];
    ledger.extraChargesAmount -= charge.amount;
    ledger.totalAmount -= charge.amount;

    ledger.extraCharges.splice(chargeIndex, 1);

    if (ledger.paidAmount >= ledger.totalAmount) {
      ledger.paidAmount = ledger.totalAmount;
      ledger.status = 'paid';
      ledger.isLocked = true;
    } else if (ledger.paidAmount > 0) {
      ledger.status = 'partial';
    }

    ledger.logs.push({
      action: 'extra_charge_removed',
      description: `Extra charge removed: ${charge.chargeType} - ${charge.amount}. Total now: ${ledger.totalAmount}`,
      performedById: performedById as any,
      createdAt: new Date()
    });

    await ledger.save();
    return ledger;
  }

  // ─── 4. Mark Overdue (bulk — call via cron or manually) ─────────────────────
  static async markOverdue(performedById: string): Promise<number> {
    const now = new Date();
    
    // Find ledgers that should be overdue
    const ledgers = await RentLedger.find({ 
      status: { $in: ['pending', 'partial'] }, 
      dueDate: { $lt: now }, 
      isLocked: false 
    });

    if (ledgers.length === 0) return 0;

    for (const ledger of ledgers) {
      ledger.status = 'overdue';
      ledger.logs.push({
        action: 'status_changed',
        description: `Auto-marked overdue. Due date was ${ledger.dueDate.toISOString()}`,
        performedById: performedById as any,
        createdAt: new Date()
      });
      await ledger.save();
    }

    return ledgers.length;
  }

  // ─── 5. Get Ledgers (filtered) ───────────────────────────────────────────────
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

  // ─── 5a. Get Payment History (Categorized Transactions) ────────────────────
  static async getPaymentHistory(filters: {
    propertyId?: string;
    tenantId?: string;
    category?: 'paid' | 'overdue' | 'due' | 'all' | 'approved' | 'rejected' | 'pending';
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: IPayment[], total: number }> {
    const query: any = {};
    if (filters.propertyId) query.propertyId = filters.propertyId;
    if (filters.tenantId) query.tenantId = filters.tenantId;

    // Map categories to payment statuses
    if (filters.category === 'paid' || filters.category === 'approved') {
      query.status = 'approved';
    } else if (filters.category === 'due' || filters.category === 'pending') {
      query.status = 'pending';
    } else if (filters.category === 'rejected') {
      query.status = 'rejected';
    }

    // Apply date range filter
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) query.createdAt.$gte = new Date(filters.from);
      if (filters.to) query.createdAt.$lte = new Date(filters.to);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Payment.find(query)
        .populate('tenantId', 'fullName phoneNumber email')
        .populate('rentLedgerId', 'month totalAmount paidAmount rentAmount lateFee')
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query)
    ]);

    return { data, total };
  }

  // ─── 6. Get Single Ledger ────────────────────────────────────────────────────
  static async getLedgerById(id: string): Promise<IRentLedger> {
    const ledger = await RentLedger.findById(id)
      .populate('tenantId', 'fullName phoneNumber')
      .populate('propertyId', 'name')
      .populate('tenantAllocationId');
    if (!ledger) throw new Error('Rent ledger not found');
    return ledger;
  }

  // ─── 7. Get Payments for a Ledger ────────────────────────────────────────
  static async getPayments(rentLedgerId: string, page: number = 1, limit: number = 10): Promise<{ data: IPayment[], total: number }> {
    const skip = (page - 1) * limit;
    const query = { rentLedgerId };
    const [data, total] = await Promise.all([
      Payment.find(query)
        .populate('createdById', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query)
    ]);
    return { data, total };
  }

  // ─── 7a. Get Pending Payments by Property ───────────────────────────────
  static async getPendingPayments(propertyId?: string, page: number = 1, limit: number = 10): Promise<{ data: IPayment[], total: number }> {
    const query: any = { status: 'pending' };
    if (propertyId) query.propertyId = propertyId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Payment.find(query)
        .populate('tenantId', 'fullName phoneNumber email')
        .populate('rentLedgerId', 'month totalAmount paidAmount')
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query)
    ]);

    return { data, total };
  }

  // ─── 7b. Get All/Status-wise Payments ──────────────────────────────────
  static async getAllPayments(propertyId?: string, status?: string, page: number = 1, limit: number = 10): Promise<{ data: IPayment[], total: number }> {
    const query: any = {};
    if (propertyId) query.propertyId = propertyId;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Payment.find(query)
        .populate('tenantId', 'fullName phoneNumber email')
        .populate('rentLedgerId', 'month totalAmount paidAmount')
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query)
    ]);

    return { data, total };
  }

  // ─── 7c. Get Recent Payments (Dashboard) ────────────────────────────────
  static async getRecentPayments(page: number = 1, limit: number = 10, status?: string): Promise<{ data: IPayment[], total: number }> {
    const query: any = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Payment.find(query)
        .populate('tenantId', 'fullName phoneNumber email')
        .populate('rentLedgerId', 'month totalAmount paidAmount')
        .populate('propertyId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query)
    ]);

    return { data, total };
  }

  // ─── 8. Get Audit Logs for a Ledger ──────────────────────────────────────────
  static async getLogs(rentLedgerId: string) {
    const ledger = await RentLedger.findById(rentLedgerId)
      .populate('logs.performedById', 'name email');
    return ledger ? ledger.logs : [];
  }

  // ─── 8a. Get Extra Charges for a Ledger ──────────────────────────────────────
  static async getExtraCharges(rentLedgerId: string) {
    const ledger = await RentLedger.findById(rentLedgerId);
    return ledger ? ledger.extraCharges : [];
  }

  // ─── 9. Generate Next Month Ledgers (monthly cron / manual trigger) ───────────
  // Call on 1st of every month. Creates ledgers for ALL active allocations.
  // Safe to call multiple times — skips duplicates (unique index on tenantId+month).
  static async generateMonthlyLedgers(
    performedById: string,
    targetMonth?: string   // YYYY-MM — defaults to current month
  ): Promise<{ created: number; skipped: number }> {
    const TenantAllocation = (await import('../models/TenantAllocation')).default;

    const now = new Date();
    const month = targetMonth
      ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Due date = 5th of the month after the target month
    const [y, m] = month.split('-').map(Number);
    const dueDate = new Date(y, m, 5); // JS months are 0-indexed, so month m = next month

    const activeAllocations = await TenantAllocation.find({ status: 'active' });

    let created = 0;
    let skipped = 0;

    for (const alloc of activeAllocations) {
      // ✅ Check if allocation started in or before this month
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
          lateFee: 0,
          totalAmount: alloc.rentAmount,
          paidAmount: 0,
          pendingAmount: 0,
          dueDate,
          status: 'pending',
          isLocked: false,
          logs: [{
            action: 'ledger_created',
            description: `Monthly ledger auto-generated for ${month}`,
            performedById: performedById as any,
          }]
        });

        created++;
      } catch (err: any) {
        if (err.code === 11000) {
          skipped++; // Ledger already exists for this tenant+month — safe to skip
        } else {
          throw err;
        }
      }
    }

    return { created, skipped };
  }

  // ─── 9a. Generate Initial Ledgers (on allocation) ───────────────────────────
  static async generateInitialLedgers(
    allocationId: string,
    createdById: string
  ): Promise<number> {
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
          lateFee: 0,
          totalAmount: alloc.rentAmount,
          paidAmount: 0,
          pendingAmount: 0,
          dueDate,
          status: 'pending',
          isLocked: false,
          logs: [{
            action: 'ledger_created',
            description: `Initial ledger generated for month ${monthStr}`,
            performedById: createdById as any,
          }]
        });

        createdCount++;
      } catch (err: any) {
        if (err.code !== 11000) throw err;
      }

      current.setMonth(current.getMonth() + 1);
    }

    return createdCount;
  }

  // ─── 9b. Sync All Ledgers (bulk check) ──────────────────────────────────────
  // Checks all active allocations and generates missing ledgers from joining date.
  static async syncAllLedgers(performedById: string): Promise<{ totalAllocations: number; ledgersCreated: number }> {
    const TenantAllocation = (await import('../models/TenantAllocation')).default;
    const activeAllocations = await TenantAllocation.find({ status: 'active' });

    let ledgersCreated = 0;
    for (const alloc of activeAllocations) {
      const created = await this.generateInitialLedgers(alloc._id.toString(), performedById);
      ledgersCreated += created;
    }

    return { totalAllocations: activeAllocations.length, ledgersCreated };
  }

  // ─── 10. Cancel Pending Ledgers on Tenant Termination ────────────────────────
  // Call when a tenant's allocation is terminated.
  // Deletes all future PENDING ledgers for that tenant (partial/paid are kept).
  static async cancelTenantLedgers(
    tenantId: string,
    performedById: string,
    currentMonth?: string  // YYYY-MM — ledgers AFTER this month are cancelled
  ): Promise<number> {
    const now = new Date();
    const month = currentMonth
      ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Find pending ledgers from next month onwards
    const futurePendingLedgers = await RentLedger.find({
      tenantId,
      status: 'pending',
      month: { $gt: month },  // string comparison works for YYYY-MM format
      isLocked: false,
    });

    const ids = futurePendingLedgers.map((l) => l._id);

    if (ids.length) {
      await RentLedger.deleteMany({ _id: { $in: ids } });
    }

    return ids.length;
  }

  // ─── 11. Get Current Month Revenue ──────────────────────────────────────────
  static async getCurrentMonthRevenue(propertyId?: string): Promise<{ totalRevenue: number; transactionCount: number }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const query: any = {
      status: 'approved',
      paidAt: { $gte: startOfMonth, $lte: endOfMonth }
    };

    if (propertyId) {
      query.propertyId = new mongoose.Types.ObjectId(propertyId);
    }

    const stats = await Payment.aggregate([
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

  // ─── 12. Get Pending Payment & Due Stats ───────────────────────────────────
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

    // 1. Pending Transactions Stats
    const transactionStats = await Payment.aggregate([
      { $match: transactionQuery },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: "$amount" }
        }
      }
    ]);

    // 2. Total Due Amount (TotalAmount - PaidAmount for all unpaid ledgers)
    const ledgerStats = await RentLedger.aggregate([
      { $match: ledgerQuery },
      {
        $group: {
          _id: null,
          due: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } }
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
}
