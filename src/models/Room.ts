import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  isActive: boolean;
  roomCode: string;
  keyNumber?: number;
}

const RoomSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  roomCode: { type: String, required: true },
  keyNumber: { type: Number },
});

export default mongoose.model<IRoom>('Room', RoomSchema);
