import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  moduleId: mongoose.Types.ObjectId;
  actions: ('read' | 'write' | 'update' | 'delete')[];
  description?: string;
}

const PermissionSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, index: true },
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
  actions: [{ type: String, enum: ['read', 'write', 'update', 'delete'], required: true }],
  description: { type: String },
}, {
  timestamps: true,
});

export default mongoose.model<IPermission>('Permission', PermissionSchema);
