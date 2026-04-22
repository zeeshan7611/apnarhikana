import PropertyInventoryAllocation, {
  IPropertyInventoryAllocation,
} from "../models/PropertyInventoryAllocation";

import Property from "../models/Property";
import Floor from "../models/Floor";
import Room from "../models/Room";
import Bed from "../models/Bed";
import RoomCategory from "../models/RoomCategory";

export default class PropertyInventoryAllocationService {
  // ✅ Create Inventory Allocation
  static async create(data: {
    propertyId: string;
    floorId: string;
    roomId: string;
    bedId: string;
    roomCategoryId: string;
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
    const bed = await Bed.findById(data.bedId);
    if (!bed) throw new Error("Bed not found");

    // 🔥 Optional: Prevent duplicate allocation
    const existing = await PropertyInventoryAllocation.findOne({
      propertyId: data.propertyId,
      floorId: data.floorId,
      roomId: data.roomId,
      bedId: data.bedId,
      status: "active"
    });

    if (existing) {
      throw new Error("This bed is already allocated in inventory");
    }

    return PropertyInventoryAllocation.create(data);
  }

  // ✅ Batch Create Inventory Allocation
  static async createBatchAllocations(batchData: Array<{
    propertyId: string;
    floorId: string;
    roomId: string;
    roomCategoryId: string;
    notes?: string;
  }>): Promise<IPropertyInventoryAllocation[]> {

    const results: IPropertyInventoryAllocation[] = [];

    for (const item of batchData) {

      // 1. Get room category
      const category = await RoomCategory.findById(item.roomCategoryId);
      if (!category) continue;

      const bedCount = category.bedCount;

      // 2. Fetch beds (no global restriction)
      const beds = await Bed.find({ isActive: true }).limit(bedCount);

      if (beds.length < bedCount) continue;

      for (const bed of beds) {

        // 3. Only prevent duplicate (roomId + bedId)
        const exists = await PropertyInventoryAllocation.findOne({
          roomId: item.roomId,
          bedId: bed._id,
          status: "active"
        });

        if (exists) continue;

        const allocation = await PropertyInventoryAllocation.create({
          propertyId: item.propertyId,
          floorId: item.floorId,
          roomId: item.roomId,
          bedId: bed._id,
          roomCategoryId: item.roomCategoryId,
          notes: item.notes,
          status: "active"
        });

        results.push(allocation);
      }
    }

    return results;
  }

  // ✅ Get all allocations (with population)
  static async getAll(): Promise<IPropertyInventoryAllocation[]> {
    return PropertyInventoryAllocation.find()
      .populate("propertyId")
      .populate("floorId")
      .populate("roomId")
      .populate("bedId")
      .populate("roomCategoryId")
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
      .populate("bedId")
      .populate("roomCategoryId");
  }

  // ✅ Update
  static async update(
    id: string,
    data: Partial<{
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