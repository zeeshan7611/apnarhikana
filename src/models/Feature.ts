import mongoose, { Document, Schema } from 'mongoose';

export interface IFeature extends Document {
  name: string;
  description?: string;
  key: string; // e.g., 'properties', 'users'
}

const FeatureSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  key: { type: String, required: true, unique: true, index: true },
}, {
  timestamps: true,
});

export default mongoose.model<IFeature>('Feature', FeatureSchema);
