import { Request, Response, NextFunction } from 'express';
import WiFiService from '../services/WiFiService';

export default class WiFiController {
  // POST /api/wifi
  static async upsertWiFi(req: Request, res: Response, next: NextFunction) {
    try {
      const wifi = await WiFiService.upsertWiFi(req.body);
      res.status(201).json({ success: true, data: wifi });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/wifi/property/:propertyId
  static async getByProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const data = await WiFiService.getWiFiByProperty(propertyId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/wifi/:id
  static async deleteWiFi(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await WiFiService.deleteWiFi(id);
      res.json({ success: true, message: 'WiFi details deleted' });
    } catch (err) {
      next(err);
    }
  }
}
