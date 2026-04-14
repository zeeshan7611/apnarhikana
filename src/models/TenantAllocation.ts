import mongoose, { Document, Schema } from 'mongoose';

export interface ITenantAllocation extends Document {
  tenantId: mongoose.Types.ObjectId;
  inventoryAllocationId: mongoose.Types.ObjectId;
  rentAmount: number;
  depositAmount: number;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'inactive' | 'terminated';
  notes?: string;
  createdById: mongoose.Types.ObjectId;
}

const TenantAllocationSchema: Schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  inventoryAllocationId: { type: Schema.Types.ObjectId, ref: 'PropertyInventoryAllocation', required: true },
  rentAmount: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'terminated'], default: 'active' },
  notes: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: 'PropertyUser', required: true },
}, {
  timestamps: true,
});

export default mongoose.model<ITenantAllocation>('TenantAllocation', TenantAllocationSchema);
