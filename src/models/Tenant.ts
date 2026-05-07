import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  fullName: string;
  phoneNumber: string;
  email: string;
  joiningDate: Date;
  alternateNumber?: string;
  emergencyContactNumber: string;
  homeContactNumber?: string;
  otp?: string;
  otpExpiry?: Date;
  oneSignalId?: string;
  isAgreementAccepted: boolean;
  agreementAcceptedAt?: Date;
  agreementVersion?: string;
  kyc?: {
    adharCard?: string;
    panCard?: string;
    otherDocument?: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
  };
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true, index: true },
  email: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  alternateNumber: { type: String },
  emergencyContactNumber: { type: String, required: true },
  homeContactNumber: { type: String },
  otp: { type: String },
  otpExpiry: { type: Date },
  oneSignalId: { type: String },
  isAgreementAccepted: { type: Boolean, default: false },
  agreementAcceptedAt: { type: Date },
  agreementVersion: { type: String },
  kyc: {
    adharCard: { type: String },
    panCard: { type: String },
    otherDocument: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String }
  },
  createdById: { type: Schema.Types.ObjectId, ref: 'PropertyUser', required: true },
}, {
  timestamps: true,
});

export default mongoose.model<ITenant>('Tenant', TenantSchema);
