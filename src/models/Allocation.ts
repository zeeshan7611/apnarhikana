import mongoose, { Document, Schema } from 'mongoose';

export interface IPriceDetails {
  rentAmount: number;
  advanceAmount?: number;
  securityDeposit?: number;
  maintenanceFee?: number;
  otherCharges?: number;
  totalAmount?: number;
  paymentFrequency?: 'monthly' | 'quarterly' | 'yearly';
}

export interface IBedAllocation {
  bedId: mongoose.Types.ObjectId;
  bedName: string;
}

export interface IAllocation extends Document {
  propertyId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  beds: IBedAllocation[];
  tenantId: string; // Clerk user ID
  checkInDate: Date;
  checkOutDate?: Date;
  priceDetails: IPriceDetails;
  notes?: string;
  status: 'active' | 'inactive' | 'terminated';
  createdAt: Date;
  updatedAt: Date;
}

const PriceDetailsSchema: Schema = new Schema({
  rentAmount: { type: Number, required: true },
  advanceAmount: { type: Number },
  securityDeposit: { type: Number },
  maintenanceFee: { type: Number },
  otherCharges: { type: Number },
  totalAmount: { type: Number },
  paymentFrequency: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
}, { _id: false });

const BedAllocationSchema: Schema = new Schema({
  bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
  bedName: { type: String, required: true },
}, { _id: false });

const AllocationSchema: Schema = new Schema({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  beds: [BedAllocationSchema],
  tenantId: { type: String, required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date },
  priceDetails: { type: PriceDetailsSchema, required: true },
  notes: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
}, {
  timestamps: true,
});

export default mongoose.model<IAllocation>('Allocation', AllocationSchema);