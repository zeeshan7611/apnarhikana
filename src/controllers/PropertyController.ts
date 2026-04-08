import { Request, Response } from 'express';
import PropertyService from '../services/PropertyService';

class PropertyController {
  async getAllProperties(req: Request, res: Response) {
    try {
      const properties = await PropertyService.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async getPropertyById(req: Request, res: Response) {
    try {
      const property = await PropertyService.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async createProperty(req: Request, res: Response) {
    try {
      const data = { ...req.body, ownerId: req.user.sub };
      const property = await PropertyService.createProperty(data);
      res.status(201).json(property);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async updateProperty(req: Request, res: Response) {
    try {
      const property = await PropertyService.updateProperty(req.params.id, req.body);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }

  async deleteProperty(req: Request, res: Response) {
    try {
      await PropertyService.deleteProperty(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default new PropertyController();