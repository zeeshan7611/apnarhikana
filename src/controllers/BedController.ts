import { Request, Response } from 'express';
import BedService from '../services/BedService';

class BedController {
  async getAllBeds(req: Request, res: Response) {
    try {
      const beds = await BedService.getAllBeds();
      res.json(beds);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getBedById(req: Request, res: Response) {
    try {
      const bed = await BedService.getBedById(req.params.id);
      if (!bed) {
        return res.status(404).json({ message: 'Bed not found' });
      }
      res.json(bed);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async createBed(req: Request, res: Response) {
    try {
      const bed = await BedService.createBed(req.body);
      res.status(201).json(bed);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateBed(req: Request, res: Response) {
    try {
      const bed = await BedService.updateBed(req.params.id, req.body);
      if (!bed) {
        return res.status(404).json({ message: 'Bed not found' });
      }
      res.json(bed);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async deleteBed(req: Request, res: Response) {
    try {
      await BedService.deleteBed(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new BedController();