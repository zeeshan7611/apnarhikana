import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentTransaction extends Document {
  rentLedgerId?: mongoose.Types.ObjectId;  // optional for deposit payments
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'due' | 'initiated' | 'rejected' | 'failed';
  paymentType: 'rent' | 'deposit' | 'extra_charge';
  referenceNumber?: string;
  utrNumber?: string;
  paymentScreenshotUrl?: string;
  notes?: string;
  paidAt: Date;
  smePaySlug?: string;
  gatewayTransactionId?: string;
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema: Schema = new Schema({
  rentLedgerId: { type: Schema.Types.ObjectId, ref: 'RentLedger', required: false, index: true },
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
    enum: ['pending', 'partial', 'paid', 'overdue', 'due', 'initiated', 'rejected', 'approved', 'failed'],
    default: 'pending',
  },
  paymentType: {
    type: String,
    enum: ['rent', 'deposit', 'extra_charge'],
    default: 'rent',
    required: true
  },
  referenceNumber: { type: String },
  utrNumber: { type: String },
  paymentScreenshotUrl: { type: String },
  notes: { type: String },
  paidAt: { type: Date, default: Date.now },
  smePaySlug: { type: String },
  gatewayTransactionId: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: 'PropertyUser' },
}, { timestamps: true });

export default mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);
