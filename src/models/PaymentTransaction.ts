import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentTransaction extends Document {
  rentLedgerId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  status: 'success' | 'failed' | 'pending';
  referenceNumber?: string;
  utrNumber?: string;
  paymentScreenshotUrl?: string;
  notes?: string;
  paidAt: Date;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema: Schema = new Schema({
  rentLedgerId: { type: Schema.Types.ObjectId, ref: 'RentLedger', required: true, index: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque'],
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending',
  },
  referenceNumber: { type: String },
  utrNumber: { type: String },
  paymentScreenshotUrl: { type: String },
  notes: { type: String },
  paidAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);
