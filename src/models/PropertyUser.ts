import mongoose, { Document, Schema } from 'mongoose';

export interface IPropertyUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  roleIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PropertyUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roleIds: [{ type: Schema.Types.ObjectId, ref: 'Role', default: [] }],
  passwordHash: { type: String }, 
}, {
  timestamps: true,
});

export default mongoose.model<IPropertyUser>('PropertyUser', PropertyUserSchema);