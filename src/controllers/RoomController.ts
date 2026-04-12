import { Request, Response, NextFunction } from "express";
import RoomService from "../services/RoomService";

export default class RoomController {
  static async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await RoomService.createRoom(req.body);
      res.status(201).json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async getAllRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await RoomService.getAllRooms();
      res.json({ success: true, data: rooms });
    } catch (error) {
      next(error);
    }
  }

  static async getRoomById(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await RoomService.getRoomById(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async updateRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await RoomService.updateRoom(req.params.id, req.body);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json({ success: true, data: room });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await RoomService.deleteRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json({ success: true, message: "Room deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}