import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  message: string;
  tenantId?: mongoose.Types.ObjectId;   // Target specific tenant
  propertyId?: mongoose.Types.ObjectId; // Target a property
  floorId?: mongoose.Types.ObjectId;    // Target a floor
  roomId?: mongoose.Types.ObjectId;     // Target a room
  type: 'announcement' | 'notification' | 'emergency';
  sentBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
  floorId: { type: Schema.Types.ObjectId, ref: 'Floor' },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  type: { type: String, enum: ['announcement', 'notification', 'emergency'], default: 'announcement' },
  sentBy: { type: Schema.Types.ObjectId, ref: 'PropertyUser', required: true },
}, {
  timestamps: true,
});

export default mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
