import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

const PermissionSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, index: true },
  resource: { type: String, required: true },
  action: { type: String, required: true },
  description: { type: String },
}, {
  timestamps: true,
});

export default mongoose.model<IPermission>('Permission', PermissionSchema);
