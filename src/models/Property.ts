import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
  name: string;
  address: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  description: { type: String },
}, {
  timestamps: true,
});

export default mongoose.model<IProperty>('Property', PropertySchema);