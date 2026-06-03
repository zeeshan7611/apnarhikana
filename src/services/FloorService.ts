import mongoose from "mongoose";
import Floor, { IFloor } from "../models/Floor";
import { AppError } from "../utils/AppError";

export default class FloorService {
  // Create Floor
  static async createFloor(data: {
    name: string;
    keyNumber?: number;
    isActive?: boolean;
  }): Promise<IFloor> {
    const existing = await Floor.findOne({ name: data.name });
    if (existing) {
      throw new AppError("Floor with this name already exists", 409);
    }

    return Floor.create(data);
  }

  // Get all floors with pagination
  static async getAllFloors(page: number = 1, limit: number = 10): Promise<{ data: IFloor[], total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Floor.find().sort({ keyNumber: 1 }).skip(skip).limit(limit),
      Floor.countDocuments()
    ]);
    return { data, total };
  }

  // Get floor by ID
  static async getFloorById(id: string): Promise<IFloor | null> {
    return Floor.findById(id);
  }

  // Update floor
  static async updateFloor(
    id: string,
    data: Partial<{
      name: string;
      keyNumber: number;
      isActive: boolean;
    }>
  ): Promise<IFloor | null> {
    return Floor.findByIdAndUpdate(id, data, { new: true });
  }

  // Delete floor
  static async deleteFloor(id: string): Promise<IFloor | null> {
    return Floor.findByIdAndDelete(id);
  }

  // Get floors by property ID based on property's numberOfFloors and isGroundfloor flag
  static async getFloorsByPropertyId(
    propertyId: string
  ): Promise<IFloor[]> {
    const Property = mongoose.model("Property");
    const property: any = await Property.findById(propertyId);
    if (!property) {
      throw new AppError("Property not found", 404);
    }

    const floors = await Floor.find().sort({ keyNumber: 1 });
    const slicedFloors = property.isGroundfloor ? floors.slice(0, property.numberOfFloors) : floors.slice(1, property.numberOfFloors + 1);



    return slicedFloors;
  }
}