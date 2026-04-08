import { Request, Response } from 'express';
import RoomService from '../services/RoomService';

export default class RoomController {
  static async createRoom(req: Request, res: Response) {
    try {
      const room = await RoomService.createRoom(req.body);
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAllRooms(req: Request, res: Response) {
    try {
      const rooms = await RoomService.getAllRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getRoomById(req: Request, res: Response) {
    try {
      const room = await RoomService.getRoomById(req.params.id);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateRoom(req: Request, res: Response) {
    try {
      const room = await RoomService.updateRoom(req.params.id, req.body);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      res.json(room);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteRoom(req: Request, res: Response) {
    try {
      const room = await RoomService.deleteRoom(req.params.id);
      if (!room) return res.status(404).json({ error: 'Room not found' });
      res.json({ message: 'Room deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
