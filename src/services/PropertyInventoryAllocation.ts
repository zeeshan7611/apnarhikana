import PropertyInventoryAllocation, {
  IPropertyInventoryAllocation,
} from "../models/PropertyInventoryAllocation";

import Property from "../models/Property";
import Floor from "../models/Floor";
import Room from "../models/Room";
import Bed from "../models/Bed";

export default class PropertyInventoryAllocationService {
  // ✅ Create Inventory Allocation
  static async create(data: {
    propertyId: string;
    floorId: string;
    roomId: string;
    beds: string;
    BedBasePrice: number;
    notes?: string;
    status?: "active" | "inactive" | "terminated";
  }): Promise<IPropertyInventoryAllocation> {
    // 1️⃣ Validate Property
    const property = await Property.findById(data.propertyId);
    if (!property) throw new Error("Property not found");

    // 2️⃣ Validate Floor
    const floor = await Floor.findById(data.floorId);
    if (!floor) throw new Error("Floor not found");

    // 3️⃣ Validate Room
    const room = await Room.findById(data.roomId);
    if (!room) throw new Error("Room not found");

    // 4️⃣ Validate Bed
    const bed = await Bed.findById(data.beds);
    if (!bed) throw new Error("Bed not found");

    // 🔥 Optional: Prevent duplicate allocation
    const existing = await PropertyInventoryAllocation.findOne({
      propertyId: data.propertyId,
      floorId: data.floorId,
      roomId: data.roomId,
      beds: data.beds,
    });

    if (existing) {
      throw new Error("This bed is already allocated in inventory");
    }

    return PropertyInventoryAllocation.create(data);
  }

  // ✅ Get all allocations (with population)
  static async getAll(): Promise<IPropertyInventoryAllocation[]> {
    return PropertyInventoryAllocation.find()
      .populate("propertyId")
      .populate("floorId")
      .populate("roomId")
      .populate("beds")
      .sort({ createdAt: -1 });
  }

  // ✅ Get by ID
  static async getById(
    id: string
  ): Promise<IPropertyInventoryAllocation | null> {
    return PropertyInventoryAllocation.findById(id)
      .populate("propertyId")
      .populate("floorId")
      .populate("roomId")
      .populate("beds");
  }

  // ✅ Update
  static async update(
    id: string,
    data: Partial<{
      BedBasePrice: number;
      notes: string;
      status: "active" | "inactive" | "terminated";
    }>
  ): Promise<IPropertyInventoryAllocation | null> {
    return PropertyInventoryAllocation.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  // ✅ Delete
  static async delete(id: string) {
    return PropertyInventoryAllocation.findByIdAndDelete(id);
  }
}