import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  tenantAllocationId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  amount: number;
  month: string; // Format: YYYY-MM
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  status: 'pending' | 'paid' | 'failed' | 'partial';
  paidAt?: Date;
  notes?: string;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  tenantAllocationId: { type: Schema.Types.ObjectId, ref: 'TenantAllocation', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'bank_transfer', 'cheque'], required: true },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'partial'], default: 'pending' },
  paidAt: { type: Date },
  notes: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: 'PropertyUser', required: true },
}, {
  timestamps: true,
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);
