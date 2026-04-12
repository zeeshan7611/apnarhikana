import mongoose, { Document, Schema } from 'mongoose';

export interface IBed extends Document {
  name: string;
  isActive: boolean;
}

const BedSchema: Schema = new Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },

});

export default mongoose.model<IBed>('Bed', BedSchema);