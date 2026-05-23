import { Request, Response, NextFunction } from 'express';
import ComplaintService from '../services/ComplaintService';

export default class ComplaintController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const creatorId = (req as any).user?.id;
      const complaint = await ComplaintService.createComplaint(req.body, creatorId);
      res.status(201).json({ success: true, data: complaint });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, status, priority, tenantId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (tenantId) filters.tenantId = tenantId;

      const { data, total } = await ComplaintService.getAllComplaints(filters, page, limit);
      res.json({ 
        success: true, 
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
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

  static async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const complaints = await ComplaintService.getRecentComplaints(4);
      res.json({ success: true, data: complaints });
    } catch (err) {
      next(err);
    }
  }

  static async getOpenCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.query;
      const stats = await ComplaintService.getOpenComplaintCount(propertyId as string);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-categories
  static async getCategories(req: Request, res: Response) {
    const categories = [
      {
        id: 'maintenance',
        label: 'Maintenance',
        subcategories: [
          { id: 'plumbing', label: 'Plumbing' },
          { id: 'electrical', label: 'Electrical' },
          { id: 'furniture', label: 'Furniture' },
          { id: 'appliances', label: 'Appliances' },
          { id: 'structural', label: 'Structural (Wall / Floor / Ceiling)' },
          { id: 'door_window', label: 'Door / Window' },
        ],
      },
      {
        id: 'cleaning',
        label: 'Cleaning',
        subcategories: [
          { id: 'room_cleaning', label: 'Room Cleaning' },
          { id: 'common_area', label: 'Common Area' },
          { id: 'washroom', label: 'Washroom / Bathroom' },
          { id: 'kitchen', label: 'Kitchen' },
          { id: 'garbage', label: 'Garbage / Waste Disposal' },
        ],
      },
      {
        id: 'water_supply',
        label: 'Water Supply',
        subcategories: [
          { id: 'no_water', label: 'No Water Supply' },
          { id: 'low_pressure', label: 'Low Water Pressure' },
          { id: 'hot_water', label: 'Hot Water / Geyser Issue' },
          { id: 'water_quality', label: 'Water Quality' },
        ],
      },
      {
        id: 'wifi_internet',
        label: 'Wi-Fi / Internet',
        subcategories: [
          { id: 'no_connection', label: 'No Connection' },
          { id: 'slow_speed', label: 'Slow Speed' },
          { id: 'router_issue', label: 'Router / Equipment Issue' },
          { id: 'wifi_password', label: 'Password / Access Issue' },
        ],
      },
      {
        id: 'security',
        label: 'Security',
        subcategories: [
          { id: 'lock_key', label: 'Lock / Key Issue' },
          { id: 'cctv', label: 'CCTV / Camera Issue' },
          { id: 'unauthorized_entry', label: 'Unauthorized Entry' },
          { id: 'safety_concern', label: 'Safety Concern' },
        ],
      },
      {
        id: 'noise',
        label: 'Noise',
        subcategories: [
          { id: 'loud_music', label: 'Loud Music' },
          { id: 'noisy_neighbours', label: 'Noisy Neighbours' },
          { id: 'construction_noise', label: 'Construction / External Noise' },
        ],
      },
      {
        id: 'staff_behaviour',
        label: 'Staff Behaviour',
        subcategories: [
          { id: 'rude_behaviour', label: 'Rude Behaviour' },
          { id: 'unprofessional', label: 'Unprofessional Conduct' },
          { id: 'delayed_response', label: 'Delayed Response' },
        ],
      },
      {
        id: 'other',
        label: 'Other',
        subcategories: [
          { id: 'general', label: 'General Complaint' },
          { id: 'suggestion', label: 'Suggestion / Feedback' },
        ],
      },
    ];

    res.json({ success: true, data: categories });
  }
}
