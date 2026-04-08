import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  roles: [{ type: String, enum: ['admin', 'manager', 'user'], default: ['user'] }],
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', UserSchema);