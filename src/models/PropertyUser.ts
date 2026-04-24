import mongoose, { Document, Schema } from 'mongoose';

export interface IPropertyUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  roleIds: mongoose.Types.ObjectId[];
  propertyId?: mongoose.Types.ObjectId[];
  phoneNumber?: string;
  education?: string;
  designation?: string;
  joiningDate?: Date;
  monthlySalary?: number;
  kycDocument?: {
    adharCard?: string;
    panCard?: string;
    drivingLicense?: string;
  };
  isActive: boolean;
  jwtAccessToken?: string;
  notficationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  education: { type: String },
  designation: { type: String },
  joiningDate: { type: Date },
  monthlySalary: { type: Number },
  passwordHash : {type:String},
  kycDocument: {
    adharCard: { type: String },
    panCard: { type: String },
    drivingLicense: { type: String }
  },
  isActive: { type: Boolean, default: true },
  roleIds: [{ type: Schema.Types.ObjectId, ref: 'Role', default: [] }],
  propertyId: [{ type: Schema.Types.ObjectId, ref: 'Property', index: true }],
  jwtAccessToken: { type: String },
  notficationToken: { type: String },
}, {
  timestamps: true,
});

export default mongoose.model<IPropertyUser>('PropertyUser', PropertyUserSchema);
