import RoomCategory, { IRoomCategory } from '../models/RoomCategory';

export default class RoomCategoryService {
  static async createRoomCategory(data: any): Promise<IRoomCategory> {
    return RoomCategory.create(data);
  }

  static async getAllRoomCategories(filters: any = {}): Promise<IRoomCategory[]> {
    return RoomCategory.find(filters)
      .populate('propertyId', 'name')
      .sort({ createdAt: -1 });
  }

  static async getRoomCategoryById(id: string): Promise<IRoomCategory | null> {
    return RoomCategory.findById(id)
      .populate('propertyId', 'name');
  }

  static async updateRoomCategory(id: string, data: any): Promise<IRoomCategory | null> {
    return RoomCategory.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteRoomCategory(id: string): Promise<IRoomCategory | null> {
    return RoomCategory.findByIdAndDelete(id);
  }

  static getStaticRoomCategories() {
    return [
      { name: "single", count: 1 },
      { name: "double", count: 2 },
      { name: "triple", count: 3 },
      { name: "four", count: 4 },
    ];
  }
}
