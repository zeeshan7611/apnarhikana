import Property, { IProperty } from '../models/Property';

class PropertyService {
  async getAllProperties(): Promise<IProperty[]> {
    return Property.find();
  }

  async getPropertyById(id: string): Promise<IProperty | null> {
    return Property.findById(id);
  }

  async createProperty(data: Partial<IProperty>): Promise<IProperty> {
    const property = new Property(data);
    return property.save();
  }

  async updateProperty(id: string, data: Partial<IProperty>): Promise<IProperty | null> {
    return Property.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteProperty(id: string): Promise<void> {
    await Property.findByIdAndDelete(id);
  }

  async getPropertiesByOwner(ownerId: string): Promise<IProperty[]> {
    return Property.find({ ownerId });
  }
}

export default new PropertyService();