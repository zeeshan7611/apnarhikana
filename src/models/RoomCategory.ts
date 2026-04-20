import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomCategory extends Document {
  roomCategory: string;
  propertyId: mongoose.Types.ObjectId;
  basePrice: number;
  bedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomCategorySchema: Schema = new Schema({
  roomCategory: { type: String, required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  basePrice: { type: Number, required: true },
  bedCount: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export default mongoose.model<IRoomCategory>('RoomCategory', RoomCategorySchema);
