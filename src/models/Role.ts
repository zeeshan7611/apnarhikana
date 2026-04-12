import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  description?: string;
  permissionIds: mongoose.Types.ObjectId[];
}

const RoleSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  permissionIds: [{ type: Schema.Types.ObjectId, ref: 'Permission', default: [] }],
}, {
  timestamps: true,
});

export default mongoose.model<IRole>('Role', RoleSchema);
