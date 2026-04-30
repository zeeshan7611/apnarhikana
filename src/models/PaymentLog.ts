import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentLog extends Document {
  rentLedgerId: mongoose.Types.ObjectId;
  paymentTransactionId?: mongoose.Types.ObjectId;
  action: 'ledger_created' | 'payment_recorded' | 'late_fee_applied' | 'status_changed' | 'ledger_locked' | 'note_added';
  previousStatus?: string;
  newStatus?: string;
  description: string;
  performedById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentLogSchema: Schema = new Schema({
  rentLedgerId: { type: Schema.Types.ObjectId, ref: 'RentLedger', required: true, index: true },
  paymentTransactionId: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction' },
  action: {
    type: String,
    enum: ['ledger_created', 'payment_recorded', 'late_fee_applied', 'status_changed', 'ledger_locked', 'note_added'],
    required: true,
  },
  previousStatus: { type: String },
  newStatus: { type: String },
  description: { type: String, required: true },
  performedById: { type: Schema.Types.ObjectId, ref: 'PropertyUser' },
}, { timestamps: true });

export default mongoose.model<IPaymentLog>('PaymentLog', PaymentLogSchema);
