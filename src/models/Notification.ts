import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  tenantId?: mongoose.Types.ObjectId;
  propertyUserId?: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'announcement' | 'complaint' | 'payment' | 'allocation' | 'kyc';
  isRead: boolean;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', index: true },
  propertyUserId: { type: Schema.Types.ObjectId, ref: 'PropertyUser', index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['announcement', 'complaint', 'payment', 'allocation', 'kyc'], 
    required: true 
  },
  isRead: { type: Boolean, default: false },
  data: { type: Schema.Types.Mixed },
}, { 
  timestamps: true 
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
