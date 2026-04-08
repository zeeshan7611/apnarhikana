import { Request, Response } from 'express';
import AllocationService from '../services/AllocationService';

class AllocationController {
  async getAllAllocations(req: Request, res: Response) {
    try {
      const allocations = await AllocationService.getAllAllocations();
      res.json(allocations);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getAllocationById(req: Request, res: Response) {
    try {
      const allocation = await AllocationService.getAllocationById(req.params.id);
      if (!allocation) {
        return res.status(404).json({ message: 'Allocation not found' });
      }
      res.json(allocation);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async createAllocation(req: Request, res: Response) {
    try {
      const allocation = await AllocationService.createAllocation(req.body);
      res.status(201).json(allocation);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateAllocation(req: Request, res: Response) {
    try {
      const allocation = await AllocationService.updateAllocation(req.params.id, req.body);
      if (!allocation) {
        return res.status(404).json({ message: 'Allocation not found' });
      }
      res.json(allocation);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async deleteAllocation(req: Request, res: Response) {
    try {
      await AllocationService.deleteAllocation(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new AllocationController();