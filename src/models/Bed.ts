import mongoose, { Document, Schema } from 'mongoose';

export interface IBed extends Document {
  roomId: mongoose.Types.ObjectId;
  name: string;
  isActive: boolean;
}

const BedSchema: Schema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

export default mongoose.model<IBed>('Bed', BedSchema);