import mongoose, { Document, Schema } from 'mongoose';

export interface IProperty extends Document {
  name: string;
  address: string;
  location: string;
  numberOfFloors: number;
  numberOfRooms: number;
  isGroundfloor: boolean;
  description?: string;
  amenities?: string[];
  contacts?: {
    managerPhone: string;
    caretakerPhone: string;
    emergencyPhone: string;
    supportEmail: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema: Schema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: { type: String, required: true },
  numberOfFloors: { type: Number, required: true },
  numberOfRooms: { type: Number, required: true },
  isGroundfloor: { type: Boolean, default: true },
  description: { type: String },
  amenities: { type: [String], default: [] },
  contacts: {
    managerPhone: { type: String },
    caretakerPhone: { type: String },
    emergencyPhone: { type: String },
    supportEmail: { type: String },
  },
}, {
  timestamps: true,
});

export default mongoose.model<IProperty>('Property', PropertySchema);