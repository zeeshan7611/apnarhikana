import Floor, { IFloor } from "../models/Floor";

export default class FloorService {
  // Create Floor
  static async createFloor(data: {
    name: string;
    isActive?: boolean;
  }): Promise<IFloor> {
    const existing = await Floor.findOne({ name: data.name });
    if (existing) {
      throw new Error("Floor with this name already exists");
    }

    return Floor.create(data);
  }

  // Get all floors
  static async getAllFloors(): Promise<IFloor[]> {
    return Floor.find().sort({ createdAt: -1 });
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
      isActive: boolean;
    }>
  ): Promise<IFloor | null> {
    return Floor.findByIdAndUpdate(id, data, { new: true });
  }

  // Delete floor
  static async deleteFloor(id: string): Promise<IFloor | null> {
    return Floor.findByIdAndDelete(id);
  }
}