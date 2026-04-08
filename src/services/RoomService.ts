import Room from '../models/Room';

export default class RoomService {
  static async createRoom(data: { name: string; isActive?: boolean; roomCode: string }) {
    return Room.create(data);
  }

  static async getAllRooms() {
    return Room.find();
  }

  static async getRoomById(id: string) {
    return Room.findById(id);
  }

  static async updateRoom(id: string, data: Partial<{ name: string; isActive: boolean; roomCode: string }>) {
    return Room.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteRoom(id: string) {
    return Room.findByIdAndDelete(id);
  }
}
