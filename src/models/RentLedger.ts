import mongoose, { Document, Schema } from 'mongoose';

export interface IExtraChargeItem {
  chargeType: 'electricity' | 'water' | 'maintenance' | 'other';
  amount: number;
  description: string;
  metadata?: any;
  createdAt: Date;
}

export interface IPaymentLogItem {
  action: 'ledger_created' | 'payment_recorded' | 'late_fee_applied' | 'status_changed' | 'ledger_locked' | 'note_added' | 'extra_charge_added' | 'extra_charge_removed';
  description: string;
  performedById?: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IRentLedger extends Document {
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  tenantAllocationId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM
  rentAmount: number;
  lateFee: number;
  totalAmount: number;
  extraChargesAmount: number;
  extraCharges: IExtraChargeItem[];
  paidAmount: number;
  pendingAmount: number;
  dueDate: Date;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'due';
  isLocked: boolean;
  logs: IPaymentLogItem[];
  createdAt: Date;
  updatedAt: Date;
}

const RentLedgerSchema: Schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  tenantAllocationId: { type: Schema.Types.ObjectId, ref: 'TenantAllocation', required: true },
  month: { type: String, required: true },        // YYYY-MM
  rentAmount: { type: Number, required: true },
  lateFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  extraChargesAmount: { type: Number, default: 0 },
  extraCharges: [{
    chargeType: { type: String, enum: ['electricity', 'water', 'maintenance', 'other'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
  }],
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'due'],
    default: 'pending',
  },
  isLocked: { type: Boolean, default: false },
  logs: [{
    action: { type: String, required: true },
    description: { type: String, required: true },
    performedById: { type: Schema.Types.ObjectId, ref: 'PropertyUser' },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Unique bill per tenant per month
RentLedgerSchema.index({ tenantId: 1, month: 1 }, { unique: true });

export default mongoose.model<IRentLedger>('RentLedger', RentLedgerSchema);
