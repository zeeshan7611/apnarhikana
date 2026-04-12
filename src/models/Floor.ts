import mongoose, { Document, Schema } from 'mongoose';

export interface IFloor extends Document {
  name: string;
  isActive: boolean;
}

const FloorSchema: Schema = new Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model<IFloor>('Floor', FloorSchema);