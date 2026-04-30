import { Request, Response, NextFunction } from 'express';
import RentLedgerService from '../services/RentLedgerService';

export default class RentLedgerController {

  // POST /create-ledger
  static async createLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const ledger = await RentLedgerService.createLedger(req.body);
      res.status(201).json({ success: true, data: ledger });
    } catch (err) {
      next(err);
    }
  }

  // POST /record-payment
  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RentLedgerService.recordPayment(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /apply-late-fee
  static async applyLateFee(req: Request, res: Response, next: NextFunction) {
    try {
      const ledger = await RentLedgerService.applyLateFee(req.body);
      res.json({ success: true, data: ledger });
    } catch (err) {
      next(err);
    }
  }

  // POST /add-extra-charge
  static async addExtraCharge(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RentLedgerService.addExtraCharge(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /remove-extra-charge
  static async removeExtraCharge(req: Request, res: Response, next: NextFunction) {
    try {
      const { chargeId, performedById } = req.body;
      const result = await RentLedgerService.removeExtraCharge(chargeId, performedById);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /mark-overdue
  static async markOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const { performedById } = req.body;
      const count = await RentLedgerService.markOverdue(performedById);
      res.json({ success: true, message: `${count} ledger(s) marked as overdue` });
    } catch (err) {
      next(err);
    }
  }

  // POST /approve-payment
  static async approvePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId, performedById } = req.body;
      if (!transactionId || !performedById) {
        return res.status(400).json({ success: false, message: 'transactionId and performedById are required' });
      }
      const result = await RentLedgerService.approvePayment(transactionId, performedById);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /reject-payment
  static async rejectPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId, performedById, notes } = req.body;
      if (!transactionId || !performedById) {
        return res.status(400).json({ success: false, message: 'transactionId and performedById are required' });
      }
      const result = await RentLedgerService.rejectPayment(transactionId, performedById, notes);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-ledgers
  static async getLedgers(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, propertyId, month, status } = req.query;
      const ledgers = await RentLedgerService.getLedgers({
        tenantId:   tenantId   as string,
        propertyId: propertyId as string,
        month:      month      as string,
        status:     status     as string,
      });
      res.json({ success: true, data: ledgers });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-ledger
  static async getLedgerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const ledger = await RentLedgerService.getLedgerById(id as string);
      res.json({ success: true, data: ledger });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-transactions
  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { rentLedgerId } = req.query;
      if (!rentLedgerId) {
        return res.status(400).json({ success: false, message: 'rentLedgerId is required' });
      }
      const transactions = await RentLedgerService.getTransactions(rentLedgerId as string);
      res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-logs
  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { rentLedgerId } = req.query;
      if (!rentLedgerId) {
        return res.status(400).json({ success: false, message: 'rentLedgerId is required' });
      }
      const logs = await RentLedgerService.getLogs(rentLedgerId as string);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-extra-charges
  static async getExtraCharges(req: Request, res: Response, next: NextFunction) {
    try {
      const { rentLedgerId } = req.query;
      if (!rentLedgerId) {
        return res.status(400).json({ success: false, message: 'rentLedgerId is required' });
      }
      const charges = await RentLedgerService.getExtraCharges(rentLedgerId as string);
      res.json({ success: true, data: charges });
    } catch (err) {
      next(err);
    }
  }

  // POST /generate-monthly-ledgers
  static async generateMonthlyLedgers(req: Request, res: Response, next: NextFunction) {
    try {
      const { performedById, targetMonth } = req.body;
      if (!performedById) {
        return res.status(400).json({ success: false, message: 'performedById is required' });
      }
      const result = await RentLedgerService.generateMonthlyLedgers(performedById, targetMonth);
      res.json({
        success: true,
        message: `Monthly ledgers generated: ${result.created} created, ${result.skipped} already existed`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /cancel-tenant-ledgers
  static async cancelTenantLedgers(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, performedById, currentMonth } = req.body;
      if (!tenantId || !performedById) {
        return res.status(400).json({ success: false, message: 'tenantId and performedById are required' });
      }
      const cancelled = await RentLedgerService.cancelTenantLedgers(tenantId, performedById, currentMonth);
      res.json({
        success: true,
        message: `${cancelled} future pending ledger(s) cancelled for tenant`,
        data: { cancelled },
      });
    } catch (err) {
      next(err);
    }
  }
}
