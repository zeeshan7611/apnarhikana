import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
  tenantId?: mongoose.Types.ObjectId;
  propertyUserId?: mongoose.Types.ObjectId;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  imageUrl?: string;
  resolutionURI?: string;
  sourceApp: 'tenant' | 'propertyManager' | 'landlord';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  propertyId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  type?: 'propertyUser' | 'tenant';
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema: Schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  propertyUserId: { type: Schema.Types.ObjectId, ref: 'PropertyUser', index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  resolutionURI: { type: String },
  sourceApp: { type: String, enum: ['tenant', 'propertyManager', 'landlord'], required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'PropertyUser' },
  resolutionNotes: { type: String },
  type: { type: String, enum: ['propertyUser', 'tenant'], default: 'tenant' },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

export default mongoose.model<IComplaint>('Complaint', ComplaintSchema);
