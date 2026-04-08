import Bed, { IBed } from '../models/Bed';

class BedService {
  async getAllBeds(): Promise<IBed[]> {
    return Bed.find().populate('floorId').populate('roomCategoryId');
  }

  async getBedById(id: string): Promise<IBed | null> {
    return Bed.findById(id).populate('floorId').populate('roomCategoryId');
  }

  async createBed(data: Partial<IBed>): Promise<IBed> {
    const bed = new Bed(data);
    return bed.save();
  }

  async updateBed(id: string, data: Partial<IBed>): Promise<IBed | null> {
    return Bed.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteBed(id: string): Promise<void> {
    await Bed.findByIdAndDelete(id);
  }

  async getBedsByFloor(floorId: string): Promise<IBed[]> {
    return Bed.find({ floorId });
  }
}

export default new BedService();