import { Request, Response } from 'express';
import FloorService from '../services/FloorService';

class FloorController {
  async getAllFloors(req: Request, res: Response) {
    try {
      const floors = await FloorService.getAllFloors();
      res.json(floors);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getFloorById(req: Request, res: Response) {
    try {
      const floor = await FloorService.getFloorById(req.params.id);
      if (!floor) {
        return res.status(404).json({ message: 'Floor not found' });
      }
      res.json(floor);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async createFloor(req: Request, res: Response) {
    try {
      const floor = await FloorService.createFloor(req.body);
      res.status(201).json(floor);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateFloor(req: Request, res: Response) {
    try {
      const floor = await FloorService.updateFloor(req.params.id, req.body);
      if (!floor) {
        return res.status(404).json({ message: 'Floor not found' });
      }
      res.json(floor);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async deleteFloor(req: Request, res: Response) {
    try {
      await FloorService.deleteFloor(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new FloorController();