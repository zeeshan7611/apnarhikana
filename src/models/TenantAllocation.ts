import mongoose, { Document, Schema } from 'mongoose';

export interface IExitLogEntry {
  exitDate?: Date;
  exitInitiatedAt: Date;
  moveOutStatus: 'pending' | 'approved' | 'revoked';
  moveOutInitiatedBy: 'tenant' | 'landlord';
  moveOutRejectionReason?: string;
  eligibleRefundPercentage?: number;
  eligibleRefundAmount?: number;
  moveOutAcknowledgedAt?: Date;
}

export interface ITenantAllocation extends Document {
  tenantId: mongoose.Types.ObjectId;
  inventoryAllocationId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  roomCategoryId: mongoose.Types.ObjectId;
  rentAmount: number;
  depositAmount: number;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'inactive' | 'terminated' | 'notice';
  notes?: string;
  createdById: mongoose.Types.ObjectId;
  exitInitiatedAt?: Date;
  eligibleRefundPercentage?: number;
  eligibleRefundAmount?: number;
  propertyUserId?: mongoose.Types.ObjectId;
  moveOutStatus?: 'pending' | 'approved' | 'revoked';
  moveOutInitiatedBy?: 'tenant' | 'landlord';
  moveOutRejectionReason?: string;
  moveOutAcknowledgedAt?: Date;
  exitLog: IExitLogEntry[];
}

const TenantAllocationSchema: Schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  inventoryAllocationId: { type: Schema.Types.ObjectId, ref: 'PropertyInventoryAllocation', required: true },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  floorId: { type: Schema.Types.ObjectId, ref: "Floor", required: true },
  roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  bedId: { type: Schema.Types.ObjectId, ref: "Bed", required: true },
  roomCategoryId: { type: Schema.Types.ObjectId, ref: "RoomCategory", required: true },
  rentAmount: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'terminated', 'notice'], default: 'active' },
  notes: { type: String },
  createdById: { type: Schema.Types.ObjectId, ref: 'PropertyUser', required: true },
  exitInitiatedAt: { type: Date },
  eligibleRefundPercentage: { type: Number, default: 0 },
  eligibleRefundAmount: { type: Number, default: 0 },
  propertyUserId: { type: Schema.Types.ObjectId, ref: 'PropertyUser' },
  moveOutStatus: { type: String, enum: ['pending', 'approved', 'revoked'] },
  moveOutInitiatedBy: { type: String, enum: ['tenant', 'landlord'] },
  moveOutRejectionReason: { type: String },
  moveOutAcknowledgedAt: { type: Date },
  exitLog: [{
    exitDate: { type: Date },
    exitInitiatedAt: { type: Date, required: true },
    moveOutStatus: { type: String, enum: ['pending', 'approved', 'revoked'], required: true },
    moveOutInitiatedBy: { type: String, enum: ['tenant', 'landlord'], required: true },
    moveOutRejectionReason: { type: String },
    eligibleRefundPercentage: { type: Number },
    eligibleRefundAmount: { type: Number },
    moveOutAcknowledgedAt: { type: Date },
  }],
}, {
  timestamps: true,
});

export default mongoose.model<ITenantAllocation>('TenantAllocation', TenantAllocationSchema);
