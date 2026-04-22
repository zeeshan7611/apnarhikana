import mongoose, { Document, Schema } from 'mongoose';

export interface IFloor extends Document {
  name: string;
  keyNumber?: number;
  isActive: boolean;
}

const FloorSchema: Schema = new Schema({
  name: { type: String, required: true },
  keyNumber: { type: Number },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model<IFloor>('Floor', FloorSchema);