import mongoose, { Document, Schema } from 'mongoose';

export interface IFloor extends Document {
  propertyId: mongoose.Types.ObjectId;
  name: string;
  isActive: boolean;
}

const FloorSchema: Schema = new Schema({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model<IFloor>('Floor', FloorSchema);