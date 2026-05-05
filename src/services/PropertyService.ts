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
    isGroundfloor?: boolean;
    description?: string;
    contacts?: {
      managerPhone: string;
      caretakerPhone: string;
      emergencyPhone: string;
      supportEmail: string;
    };
  }): Promise<IProperty> {
    const existing = await Property.findOne({ name: data.name });
    if (existing) {
      throw new Error("Property with this name already exists");
    }

    return Property.create(data);
  }

  // Get all properties with pagination
  static async getAllProperties(page: number = 1, limit: number = 10): Promise<{ data: IProperty[], total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Property.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Property.countDocuments()
    ]);
    return { data, total };
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
      isGroundfloor: boolean;
      description: string;
      contacts: {
        managerPhone: string;
        caretakerPhone: string;
        emergencyPhone: string;
        supportEmail: string;
      };
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
      return { totalCapacity: 0, occupiedCount: 0, availableCount: 0, occupancyPercentage: 0 };
    }

    // 2. Get occupied count (active tenant allocations linked to these inventory IDs)
    const inventoryIds = totalAllocations.map(a => a._id);
    const occupiedCount = await TenantAllocation.countDocuments({
      inventoryAllocationId: { $in: inventoryIds },
      status: "active"
    });

    const availableCount = totalCapacity - occupiedCount;
    const occupancyPercentage = (occupiedCount / totalCapacity) * 100;

    return {
      totalCapacity,
      occupiedCount,
      availableCount,
      occupancyPercentage: parseFloat(occupancyPercentage.toFixed(2))
    };
  }

  // Get bulk occupancy statistics for multiple property IDs
  static async getBulkOccupancyStats(propertyIds: string[]) {
    const results = [];
    for (const id of propertyIds) {
      const stats = await this.getOccupancyStats(id);
      results.push({
        propertyId: id,
        ...stats
      });
    }
    return results;
  }

  // Get property names with IDs only
  static async getPropertyNames(): Promise<{ _id: any; name: string }[]> {
    return Property.find({}, { name: 1 }).lean() as any;
  }

  // Update support details (contacts)
  static async updateSupportDetails(id: string, contacts: any): Promise<IProperty | null> {
    return Property.findByIdAndUpdate(id, { contacts }, { new: true });
  }
}