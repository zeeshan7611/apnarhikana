import Bed, { IBed } from "../models/Bed";

export default class BedService {
  // Create Bed
  static async createBed(data: {
    name: string;
    keyNumber?: number;
    isActive?: boolean;
  }): Promise<IBed> {
    const existing = await Bed.findOne({ name: data.name });
    if (existing) {
      throw new Error("Bed with this name already exists");
    }

    return Bed.create(data);
  }

  // Get all beds
  static async getAllBeds(): Promise<IBed[]> {
    return Bed.find().sort({ keyNumber: 1 });
  }

  // Get bed by ID
  static async getBedById(id: string): Promise<IBed | null> {
    return Bed.findById(id);
  }

  // Update bed
  static async updateBed(
    id: string,
    data: Partial<{
      name: string;
      keyNumber: number;
      isActive: boolean;
    }>
  ): Promise<IBed | null> {
    return Bed.findByIdAndUpdate(id, data, { new: true });
  }

  // Delete bed
  static async deleteBed(id: string): Promise<IBed | null> {
    return Bed.findByIdAndDelete(id);
  }
}