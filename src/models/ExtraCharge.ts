import mongoose, { Document, Schema } from 'mongoose';

export interface IExtraCharge extends Document {
  rentLedgerId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  chargeType: 'electricity' | 'water' | 'maintenance' | 'other';
  amount: number;
  description: string;
  metadata?: any; // For flexible data like units, rates, etc.
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExtraChargeSchema: Schema = new Schema({
  rentLedgerId: { type: Schema.Types.ObjectId, ref: 'RentLedger', required: true, index: true },
  tenantId:     { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  propertyId:   { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  chargeType: {
    type: String,
    enum: ['electricity', 'water', 'maintenance', 'other'],
    required: true,
  },
  amount:       { type: Number, required: true },
  description:  { type: String, required: true },
  metadata:     { type: Schema.Types.Mixed }, // e.g. { previousUnit: 100, currentUnit: 150, ratePerUnit: 10 }
  createdById:  { type: Schema.Types.ObjectId, ref: 'PropertyUser', required: true },
}, { timestamps: true });

export default mongoose.model<IExtraCharge>('ExtraCharge', ExtraChargeSchema);
