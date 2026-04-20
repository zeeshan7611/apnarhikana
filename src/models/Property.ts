import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
  name: string;
  address: string;
  location: string;
  numberOfFloors: number;
  numberOfRooms: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: { type: String, required: true },
  numberOfFloors: { type: Number, required: true },
  numberOfRooms: { type: Number, required: true },
  description: { type: String },
}, {
  timestamps: true,
});

export default mongoose.model<IProperty>('Property', PropertySchema);