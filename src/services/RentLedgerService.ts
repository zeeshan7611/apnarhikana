import mongoose from 'mongoose';
import RentLedger, { IRentLedger } from '../models/RentLedger';
import PaymentTransaction, { IPaymentTransaction } from '../models/PaymentTransaction';
import PaymentLog from '../models/PaymentLog';

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
    });

    await PaymentLog.create({
      rentLedgerId: ledger._id,
      action: 'ledger_created',
      newStatus: 'pending',
      description: `Ledger created for month ${data.month}. Rent: ${data.rentAmount}, Late fee: ${lateFee}`,
      performedById: data.createdById,
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
    status?: 'pending' | 'success';
    createdById?: string;
  }): Promise<{ ledger: IRentLedger; transaction: IPaymentTransaction }> {
    const ledger = await RentLedger.findById(data.rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');
    if (ledger.isLocked) throw new Error('Ledger is locked and cannot accept new payments');

    const initialStatus = data.status || 'pending';

    // Create transaction
    const transaction = await PaymentTransaction.create({
      rentLedgerId: ledger._id,
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      amount: data.amount,
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

    if (initialStatus === 'success') {
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

    await ledger.save();

    // Audit log
    await PaymentLog.create({
      rentLedgerId: ledger._id,
      paymentTransactionId: transaction._id,
      action: 'payment_recorded',
      previousStatus,
      newStatus: ledger.status,
      description: `Payment of ${data.amount} recorded via ${data.paymentMethod} with status ${initialStatus}. Paid so far: ${ledger.paidAmount}/${ledger.totalAmount}, Pending: ${ledger.pendingAmount}`,
      performedById: data?.createdById,
    });

    return { ledger, transaction };
  }

  // ─── 2a. Approve a Pending Payment ──────────────────────────────────────────
  static async approvePayment(
    transactionId: string,
    performedById: string
  ): Promise<{ ledger: IRentLedger; transaction: IPaymentTransaction }> {
    const transaction = await PaymentTransaction.findById(transactionId);
    if (!transaction) throw new Error('Payment transaction not found');
    if (transaction.status !== 'pending') throw new Error('Only pending transactions can be approved');

    const ledger = await RentLedger.findById(transaction.rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');

    const previousStatus = ledger.status;

    // Update Transaction
    transaction.status = 'success';
    await transaction.save();

    // Update Ledger
    ledger.pendingAmount = Math.max(0, ledger.pendingAmount - transaction.amount);
    ledger.paidAmount += transaction.amount;

    if (ledger.paidAmount >= ledger.totalAmount) {
      ledger.paidAmount = ledger.totalAmount; // cap
      ledger.status = 'paid';
      ledger.isLocked = true;
    } else {
      ledger.status = 'partial';
    }

    await ledger.save();

    // Audit Log
    await PaymentLog.create({
      rentLedgerId: ledger._id,
      paymentTransactionId: transaction._id,
      action: 'status_changed',
      previousStatus,
      newStatus: ledger.status,
      description: `Payment transaction of ${transaction.amount} approved. Paid so far: ${ledger.paidAmount}/${ledger.totalAmount}`,
      performedById: new mongoose.Types.ObjectId(performedById),
    });

    return { ledger, transaction };
  }

  // ─── 2b. Reject a Pending Payment ───────────────────────────────────────────
  static async rejectPayment(
    transactionId: string,
    performedById: string,
    notes?: string
  ): Promise<{ ledger: IRentLedger; transaction: IPaymentTransaction }> {
    const transaction = await PaymentTransaction.findById(transactionId);
    if (!transaction) throw new Error('Payment transaction not found');
    if (transaction.status !== 'pending') throw new Error('Only pending transactions can be rejected');

    const ledger = await RentLedger.findById(transaction.rentLedgerId);
    if (!ledger) throw new Error('Rent ledger not found');

    // Update Transaction
    transaction.status = 'failed';
    if (notes) transaction.notes = notes;
    await transaction.save();

    // Update Ledger
    ledger.pendingAmount = Math.max(0, ledger.pendingAmount - transaction.amount);
    await ledger.save();

    // Audit Log
    await PaymentLog.create({
      rentLedgerId: ledger._id,
      paymentTransactionId: transaction._id,
      action: 'status_changed',
      previousStatus: ledger.status,
      newStatus: ledger.status,
      description: `Payment transaction of ${transaction.amount} rejected. ${notes ? 'Reason: ' + notes : ''}`,
      performedById: new mongoose.Types.ObjectId(performedById),
    });

    return { ledger, transaction };
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
    ledger.totalAmount = ledger.rentAmount + ledger.lateFee;
    await ledger.save();

    await PaymentLog.create({
      rentLedgerId: ledger._id,
      action: 'late_fee_applied',
      description: `Late fee of ${data.lateFee} applied. New total: ${ledger.totalAmount}`,
      performedById: data.performedById,
    });

    return ledger;
  }

  // ─── 4. Mark Overdue (bulk — call via cron or manually) ─────────────────────
  static async markOverdue(performedById: string): Promise<number> {
    const now = new Date();
    const result = await RentLedger.updateMany(
      { status: { $in: ['pending', 'partial'] }, dueDate: { $lt: now }, isLocked: false },
      { $set: { status: 'overdue' } }
    );

    // Bulk log — find updated ledgers for audit
    const overdueLedgers = await RentLedger.find({ status: 'overdue', dueDate: { $lt: now } });
    const logs = overdueLedgers.map((l) => ({
      rentLedgerId: l._id,
      action: 'status_changed',
      previousStatus: 'pending/partial',
      newStatus: 'overdue',
      description: `Auto-marked overdue. Due date was ${l.dueDate.toISOString()}`,
      performedById: new mongoose.Types.ObjectId(performedById),
    }));
    if (logs.length) await PaymentLog.insertMany(logs);

    return result.modifiedCount;
  }

  // ─── 5. Get Ledgers (filtered) ───────────────────────────────────────────────
  static async getLedgers(filters: {
    tenantId?: string;
    propertyId?: string;
    month?: string;
    status?: string;
  }): Promise<IRentLedger[]> {
    const query: any = {};
    if (filters.tenantId) query.tenantId = filters.tenantId;
    if (filters.propertyId) query.propertyId = filters.propertyId;
    if (filters.month) query.month = filters.month;
    if (filters.status) query.status = filters.status;

    return RentLedger.find(query)
      .populate('tenantId', 'fullName phoneNumber')
      .populate('propertyId', 'name')
      .populate('tenantAllocationId')
      .sort({ month: -1, createdAt: -1 });
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

  // ─── 7. Get Transactions for a Ledger ────────────────────────────────────────
  static async getTransactions(rentLedgerId: string): Promise<IPaymentTransaction[]> {
    return PaymentTransaction.find({ rentLedgerId })
      .populate('createdById', 'name email')
      .sort({ createdAt: -1 });
  }

  // ─── 8. Get Audit Logs for a Ledger ──────────────────────────────────────────
  static async getLogs(rentLedgerId: string) {
    return PaymentLog.find({ rentLedgerId })
      .populate('performedById', 'name email')
      .sort({ createdAt: -1 });
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
      try {
        await RentLedger.create({
          tenantId: alloc.tenantId,
          propertyId: (alloc as any).propertyId || (alloc as any).inventoryAllocationId,
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
        });

        await PaymentLog.create({
          rentLedgerId: (await RentLedger.findOne({ tenantId: alloc.tenantId, month }))!._id,
          action: 'ledger_created',
          newStatus: 'pending',
          description: `Monthly ledger auto-generated for ${month}`,
          performedById: new mongoose.Types.ObjectId(performedById),
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
}
