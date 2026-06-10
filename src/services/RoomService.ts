import mongoose from "mongoose";
import Room, { IRoom } from "../models/Room";
import { AppError } from "../utils/AppError";

export default class RoomService {
  // Create Room
  static async createRoom(data: {
    name: string;
    isActive?: boolean;
    roomCode: string;
    keyNumber?: number;
  }): Promise<IRoom> {
    const existing = await Room.findOne({ name: data.name });
    if (existing) {
      throw new AppError("Room with this name already exists", 409);
    }

    return Room.create(data);
  }

  // Get all rooms
  static async getAllRooms(): Promise<IRoom[]> {
    return Room.find().sort({ keyNumber: 1 });
  }

  // Get single room
  static async getRoomById(id: string): Promise<IRoom | null> {
    return Room.findById(id);
  }

  // Update room
  static async updateRoom(
    id: string,
    data: Partial<{
      name: string;
      isActive: boolean;
      roomCode: string;
      keyNumber: number;
    }>
  ): Promise<IRoom | null> {
    return Room.findByIdAndUpdate(id, data, { new: true });
  }

  // Delete room
  static async deleteRoom(id: string): Promise<IRoom | null> {
    const room = await Room.findById(id);
    if (!room) return null;

    // Find all properties that reference this room via inventory allocations
    const PropertyInventoryAllocation = (await import('../models/PropertyInventoryAllocation')).default;
    const Property = (await import('../models/Property')).default;

    const affectedAllocations = await PropertyInventoryAllocation.find({ roomId: id }).distinct('propertyId');
    if (affectedAllocations.length > 0) {
      await Property.updateMany(
        { _id: { $in: affectedAllocations }, numberOfRooms: { $gt: 0 } },
        { $inc: { numberOfRooms: -1 } }
      );
    }

    return Room.findByIdAndDelete(id);
  }

  // Get rooms by property ID based on property's numberOfRooms
  static async getRoomsByPropertyId(propertyId: string): Promise<IRoom[]> {
    const Property = mongoose.model("Property");
    const property: any = await Property.findById(propertyId);
    if (!property) {
      throw new AppError("Property not found", 404);
    }

    const rooms = await Room.find({ isActive: true }).sort({ keyNumber: 1 });
    return rooms.slice(0, property.numberOfRooms);
  }
}