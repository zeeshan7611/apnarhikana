import mongoose, { Document, Schema } from 'mongoose';

export interface IExtraChargeItem {
  title: string;
  type: 'electricity' | 'water' | 'maintenance' | 'other';
  amount: number;
  description?: string;
  createdAt: Date;
}

export interface IRentLedger extends Document {
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  tenantAllocationId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM
  rentAmount: number;
  extraCharges: IExtraChargeItem[];
  extraChargesAmount: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: Date;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'due';
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RentLedgerSchema: Schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  tenantAllocationId: { type: Schema.Types.ObjectId, ref: 'TenantAllocation', required: true },
  month: { type: String, required: true },        // YYYY-MM
  rentAmount: { type: Number, required: true },
  extraCharges: [{
    title: { type: String, required: true },
    type: { type: String, enum: ['electricity', 'water', 'maintenance', 'other'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  extraChargesAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue', 'due'],
    default: 'pending',
  },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true });

// Unique bill per tenant per month
RentLedgerSchema.index({ tenantId: 1, month: 1 }, { unique: true });

export default mongoose.model<IRentLedger>('RentLedger', RentLedgerSchema);
