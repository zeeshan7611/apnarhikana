import Property, { IProperty } from "../models/Property";
import PropertyInventoryAllocation from "../models/PropertyInventoryAllocation";
import TenantAllocation from "../models/TenantAllocation";

export default class PropertyService {
  // Create Property
  static async createProperty(data: {
    name: string;
    address: string;
    location: string;
    numberOfFloors: number;
    numberOfRooms: number;
    description?: string;
  }): Promise<IProperty> {
    const existing = await Property.findOne({ name: data.name });
    if (existing) {
      throw new Error("Property with this name already exists");
    }

    return Property.create(data);
  }

  // Get all properties
  static async getAllProperties(): Promise<IProperty[]> {
    return Property.find().sort({ createdAt: -1 });
  }

  // Get property by ID
  static async getPropertyById(id: string): Promise<IProperty | null> {
    return Property.findById(id);
  }

  // Update property
  static async updateProperty(
    id: string,
    data: Partial<{
      name: string;
      address: string;
      location: string;
      numberOfFloors: number;
      numberOfRooms: number;
      description: string;
    }>
  ): Promise<IProperty | null> {
    return Property.findByIdAndUpdate(id, data, { new: true });
  }

  // Delete property
  static async deleteProperty(id: string): Promise<IProperty | null> {
    return Property.findByIdAndDelete(id);
  }

  // Get occupancy statistics
  static async getOccupancyStats(propertyId?: string) {
    const filter: any = { status: "active" };
    if (propertyId) filter.propertyId = propertyId;

    // 1. Get total capacity (active inventory allocations)
    const totalAllocations = await PropertyInventoryAllocation.find(filter);
    const totalCapacity = totalAllocations.length;

    if (totalCapacity === 0) {
      return { totalCapacity: 0, occupiedCount: 0, occupancyPercentage: 0 };
    }

    // 2. Get occupied count (active tenant allocations linked to these inventory IDs)
    const inventoryIds = totalAllocations.map(a => a._id);
    const occupiedCount = await TenantAllocation.countDocuments({
      inventoryAllocationId: { $in: inventoryIds },
      status: "active"
    });

    const occupancyPercentage = (occupiedCount / totalCapacity) * 100;

    return {
      totalCapacity,
      occupiedCount,
      occupancyPercentage: parseFloat(occupancyPercentage.toFixed(2))
    };
  }
}