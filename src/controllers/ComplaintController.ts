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
        id: 'cleaning',
        label: 'Cleaning',
        subcategories: [
          { id: 'quality', label: 'Quality' },
          { id: 'inconsistency', label: 'Inconsistency' },
          { id: 'not_proper', label: 'Not Proper' },
          { id: 'waste_management', label: 'Waste Management' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'electrical',
        label: 'Electrical',
        subcategories: [
          { id: 'power_cut', label: 'Power Cut' },
          { id: 'meter_issue', label: 'Meter Issue' },
          { id: 'mcb', label: 'MCB' },
          { id: 'geyser', label: 'Geyser' },
          { id: 'power_backup', label: 'Power Backup' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'food',
        label: 'Food',
        subcategories: [
          { id: 'quality', label: 'Quality' },
          { id: 'hygiene', label: 'Hygiene' },
          { id: 'timing', label: 'Timing' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'water',
        label: 'Water',
        subcategories: [
          { id: 'no_water', label: 'No Water' },
          { id: 'bad_quality', label: 'Bad Quality' },
          { id: 'cold_hot_water', label: 'Cold & Hot Water' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'house_keeping',
        label: 'House Keeping',
        subcategories: [
          { id: 'pest_control', label: 'Pest Control' },
          { id: 'mattress', label: 'Mattress' },
          { id: 'pillow', label: 'Pillow' },
          { id: 'bedsheet', label: 'BedSheet' },
          { id: 'curtains', label: 'Curtains' },
          { id: 'garbage_bag', label: 'Garbage Bag' },
        ],
      },
      {
        id: 'plumbing',
        label: 'Plumbing',
        subcategories: [
          { id: 'washbasin', label: 'Washbasin' },
          { id: 'showers', label: 'Showers' },
          { id: 'pipe_leakage', label: 'Pipe Leakage' },
          { id: 'sink_leakage', label: 'Sink Leakage' },
          { id: 'jet', label: 'Jet' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'payment',
        label: 'Payment',
        subcategories: [
          { id: 'rent', label: 'Rent' },
          { id: 'utility_payment', label: 'Utility Payment' },
          { id: 'late_fine', label: 'Late Fine' },
          { id: 'dues', label: 'Dues' },
          { id: 'security', label: 'Security' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'internet',
        label: 'Internet',
        subcategories: [
          { id: 'connectivity', label: 'Connectivity' },
          { id: 'recharge', label: 'Recharge' },
          { id: 'usage', label: 'Usage' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'app',
        label: 'App',
        subcategories: [
          { id: 'unable_to_login', label: 'Unable to Login' },
          { id: 'crash', label: 'Crash' },
          { id: 'unable_to_upload_doc', label: 'Unable to Upload Doc' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'roommates_flatmates',
        label: "Roommate's / Flat-mates",
        subcategories: [
          { id: 'behavior', label: 'Behavior' },
          { id: 'noise_disturbance', label: 'Noise / Disturbance' },
          { id: 'smoking_alcohol', label: 'Smoking / Alcohol' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'staff',
        label: 'Staff',
        subcategories: [
          { id: 'behavior', label: 'Behavior' },
          { id: 'absence', label: 'Absence' },
          { id: 'smoking_alcohol', label: 'Smoking / Alcohol' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'security_safety',
        label: 'Security & Safety',
        subcategories: [
          { id: 'lock_key', label: 'Lock & Key' },
          { id: 'biometric', label: 'Biometric' },
          { id: 'terrace', label: 'Terrace' },
          { id: 'fire_incident', label: 'Fire Incident' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'security_guard',
        label: 'Security Guard',
        subcategories: [
          { id: 'theft_stealing', label: 'Theft & Stealing' },
          { id: 'electronics', label: 'Electronics' },
          { id: 'clothes', label: 'Clothes' },
          { id: 'personal_belongings', label: 'Personal Belongings' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'fitting_carpentry',
        label: 'Fitting / Carpentry',
        subcategories: [
          { id: 'bed', label: 'Bed' },
          { id: 'chair', label: 'Chair' },
          { id: 'nails_fix', label: 'Nails Fix' },
          { id: 'door', label: 'Door' },
          { id: 'almirah', label: 'Almirah' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'medical',
        label: 'Medical',
        subcategories: [
          { id: 'urgent', label: 'Urgent' },
          { id: 'fever', label: 'Fever' },
          { id: 'other', label: 'Other' },
        ],
      },
      {
        id: 'other',
        label: 'Other',
        subcategories: [
          { id: 'other', label: 'Other' },
        ],
      },
    ];

    res.json({ success: true, data: categories });
  }
}
