import { Request, Response, NextFunction } from 'express';
import ComplaintService from '../services/ComplaintService';

export default class ComplaintController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const complaint = await ComplaintService.createComplaint(req.body);
      res.status(201).json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, status, priority, tenantId } = req.query;
      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (tenantId) filters.tenantId = tenantId;

      const complaints = await ComplaintService.getAllComplaints(filters);
      res.json({ success: true, data: complaints });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const complaint = await ComplaintService.getComplaintById(id as string);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      res.json({ success: true, data: complaint });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const complaint = await ComplaintService.updateComplaint(id, req.body);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      res.json({ success: true, data: complaint });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const complaint = await ComplaintService.deleteComplaint(id);
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      res.json({ success: true, message: "Complaint deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
