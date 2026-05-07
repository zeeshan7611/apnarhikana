import mongoose, { Document, Schema } from 'mongoose';

export interface IWiFi extends Document {
  propertyId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  ssid: string;
  password: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WiFiSchema: Schema = new Schema({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true, index: true },
  ssid: { type: String, required: true },
  password: { type: String, required: true },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export default mongoose.model<IWiFi>('WiFi', WiFiSchema);
