import Floor, { IFloor } from '../models/Floor';

class FloorService {
  async getAllFloors(): Promise<IFloor[]> {
    return Floor.find().populate('propertyId');
  }

  async getFloorById(id: string): Promise<IFloor | null> {
    return Floor.findById(id).populate('propertyId');
  }

  async createFloor(data: Partial<IFloor>): Promise<IFloor> {
    const floor = new Floor(data);
    return floor.save();
  }

  async updateFloor(id: string, data: Partial<IFloor>): Promise<IFloor | null> {
    return Floor.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteFloor(id: string): Promise<void> {
    await Floor.findByIdAndDelete(id);
  }

  async getFloorsByProperty(propertyId: string): Promise<IFloor[]> {
    return Floor.find({ propertyId });
  }
}

export default new FloorService();