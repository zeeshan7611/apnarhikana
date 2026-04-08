import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
  name: string;
  address: string;
  description?: string;
  ownerId: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  description: { type: String },
  ownerId: { type: String, required: true },
}, {
  timestamps: true,
});

export default mongoose.model<IProperty>('Property', PropertySchema);