import Property, { IProperty } from "../models/Property";

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
}