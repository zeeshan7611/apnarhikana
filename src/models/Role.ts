import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string;
  propertyId: mongoose.Types.ObjectId;
  description?: string;
  permissionIds: mongoose.Types.ObjectId[];
}

const RoleSchema: Schema = new Schema({
  name: { type: String, required: true, index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', index: true },
  description: { type: String },
  permissionIds: [{ type: Schema.Types.ObjectId, ref: 'Permission', default: [] }],
}, {
  timestamps: true,
});

RoleSchema.index({ name: 1, propertyId: 1 }, { unique: true });

export default mongoose.model<IRole>('Role', RoleSchema);
