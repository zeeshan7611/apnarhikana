import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  rentLedgerId: mongoose.Types.ObjectId;
  tenantAllocationId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  amount: number;
  month: string; // Format: YYYY-MM
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  status: 'pending' | 'approved' | 'rejected' | 'failed' | 'partial';
  paidAt?: Date;
  referenceNumber?: string;
  utrNumber?: string;
  paymentScreenshotUrl?: string;
  notes?: string;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema({
  rentLedgerId: { type: Schema.Types.ObjectId, ref: 'RentLedger', required: true, index: true },
  tenantAllocationId: { type: Schema.Types.ObjectId, ref: 'TenantAllocation', required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'bank_transfer', 'cheque'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'failed', 'partial'], default: 'pending' },
  paidAt: { type: Date, default: Date.now },
  referenceNumber: { type: String },
  utrNumber: { type: String },
  paymentScreenshotUrl: { type: String },
  notes: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: 'PropertyUser' },
}, {
  timestamps: true,
});

export default mongoose.model<IPayment>('Payment', PaymentSchema);
