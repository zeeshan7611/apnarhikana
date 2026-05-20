import { Request, Response, NextFunction } from 'express';
import RentLedgerService from '../services/RentLedgerService';
import NotificationService from '../services/NotificationService';
import RentLedger from '../models/RentLedger';

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

  // POST /collect-rent
  static async collectRent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RentLedgerService.collectRent({
        ...req.body,
        createdById: (req as any).user.id,
        status: 'paid' // Direct collection is always pre-approved (marked as paid)
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /add-extra-charge
  static async addExtraCharge(req: Request, res: Response, next: NextFunction) {
    try {
      const { rentLedgerId, title, type, amount, description, performedById } = req.body;
      const result = await RentLedgerService.addExtraCharge({
        rentLedgerId,
        title,
        type,
        amount,
        description,
        performedById
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /remove-extra-charge
  static async removeExtraCharge(req: Request, res: Response, next: NextFunction) {
    try {
      const { rentLedgerId, chargeId } = req.body;
      const result = await RentLedgerService.removeExtraCharge(rentLedgerId, chargeId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }


  // POST /complete-payment
  static async completePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId } = req.body;
      const result = await RentLedgerService.completePayment(transactionId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-ledgers
  static async getLedgers(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, propertyId, month, status } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { data, total } = await RentLedgerService.getLedgers({
        tenantId: tenantId as string,
        propertyId: propertyId as string,
        month: month as string,
        status: status as string,
        page,
        limit
      });
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

  // GET /get-payment-history
  static async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, propertyId, status, from, to } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { data, total } = await RentLedgerService.getPaymentHistory({
        tenantId: tenantId as string,
        propertyId: propertyId as string,
        status: status as string,
        from: from as string,
        to: to as string,
        page,
        limit
      });
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

  // GET /get-property-transactions
  static async getPropertyTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, tenantId, status, paymentType, from, to } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { data, total } = await RentLedgerService.getPropertyTransactions({
        propertyId: propertyId as string,
        tenantId: tenantId as string,
        status: status as string,
        paymentType: paymentType as string,
        from: from as string,
        to: to as string,
        page,
        limit
      });

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

  // GET /get-recent-transactions
  static async getRecentTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const data = await RentLedgerService.getRecentTransactions(limit);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // POST /mark-overdue
  static async markOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RentLedger.find({ status: { $in: ['pending', 'partial'] }, dueDate: { $lt: new Date() } });
      for (const ledger of result) {
        await RentLedgerService.recalculateLedger(ledger._id.toString());
      }
      res.json({ success: true, message: `${result.length} ledger(s) checked/updated` });
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

  // POST /sync-all-ledgers
  static async syncAllLedgers(req: Request, res: Response, next: NextFunction) {
    try {
      const { performedById } = req.body;
      if (!performedById) {
        return res.status(400).json({ success: false, message: 'performedById is required' });
      }
      const result = await RentLedgerService.syncAllLedgers(performedById);
      res.json({
        success: true,
        message: `Ledger synchronization complete. ${result.ledgersCreated} new ledgers created for ${result.totalAllocations} active allocations.`,
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

  // GET /get-revenue-stats
  static async getRevenueStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.query;
      const stats = await RentLedgerService.getCurrentMonthRevenue(propertyId as string);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-pending-payment-stats
  static async getPendingPaymentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.query;
      const stats = await RentLedgerService.getPendingPaymentStats(propertyId as string);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  // POST /send-rent-reminder
  static async sendRentReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const { ledgerId } = req.body;
      if (!ledgerId) {
        return res.status(400).json({ success: false, message: 'ledgerId is required' });
      }

      const ledger = await RentLedger.findById(ledgerId);
      if (!ledger) {
        return res.status(404).json({ success: false, message: 'Ledger not found' });
      }

      await NotificationService.sendRentReminder(
        ledger.tenantId.toString(),
        ledger.month,
        ledger.totalAmount - ledger.paidAmount
      );

      res.json({ success: true, message: 'Rent reminder sent successfully' });
    } catch (err) {
      next(err);
    }
  }

  // POST /send-bulk-rent-reminder
  static async sendBulkRentReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantIds, month } = req.body;
      if (!tenantIds || !Array.isArray(tenantIds) || !month) {
        return res.status(400).json({ success: false, message: 'tenantIds (array) and month are required' });
      }

      const ledgers = await RentLedger.find({
        tenantId: { $in: tenantIds },
        month,
        status: { $in: ['pending', 'partial', 'overdue'] }
      });

      for (const ledger of ledgers) {
        await NotificationService.sendRentReminder(
          ledger.tenantId.toString(),
          ledger.month,
          ledger.totalAmount - ledger.paidAmount
        );
      }

      res.json({ success: true, message: `Reminders sent to ${ledgers.length} tenants` });
    } catch (err) {
      next(err);
    }
  }

  // POST /trigger-rent-reminder
  static async triggerRentReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, month } = req.body;
      
      let query: any = { status: { $in: ['pending', 'partial', 'overdue'] } };
      
      if (propertyId) {
        query.propertyId = propertyId;
      }
      
      if (month) {
        query.month = month;
      }

      const ledgers = await RentLedger.find(query);
      
      if (ledgers.length === 0) {
        return res.status(404).json({ success: false, message: 'No pending rent ledgers found' });
      }

      let sentCount = 0;
      for (const ledger of ledgers) {
        try {
          await NotificationService.sendRentReminder(
            ledger.tenantId.toString(),
            ledger.month,
            ledger.totalAmount - ledger.paidAmount
          );
          sentCount++;
        } catch (err) {
          console.error(`Failed to send reminder for ledger ${ledger._id}:`, err);
        }
      }

      res.json({
        success: true,
        message: `Rent reminders triggered successfully`,
        data: {
          total: ledgers.length,
          sent: sentCount,
          failed: ledgers.length - sentCount
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /trigger-single-tenant-reminder
  static async triggerSingleTenantReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, month } = req.body;
      
      if (!tenantId) {
        return res.status(400).json({ success: false, message: 'tenantId is required' });
      }

      let query: any = {
        tenantId,
        status: { $in: ['pending', 'partial', 'overdue'] }
      };
      
      if (month) {
        query.month = month;
      }

      const ledgers = await RentLedger.find(query);
      
      if (ledgers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No pending rent ledgers found for this tenant'
        });
      }

      let sentCount = 0;
      for (const ledger of ledgers) {
        try {
          await NotificationService.sendRentReminder(
            ledger.tenantId.toString(),
            ledger.month,
            ledger.totalAmount - ledger.paidAmount
          );
          sentCount++;
        } catch (err) {
          console.error(`Failed to send reminder for ledger ${ledger._id}:`, err);
        }
      }

      res.json({
        success: true,
        message: `Rent reminder(s) sent to tenant successfully`,
        data: {
          tenantId,
          total: ledgers.length,
          sent: sentCount,
          failed: ledgers.length - sentCount,
          ledgers: ledgers.map(l => ({
            ledgerId: l._id,
            month: l.month,
            pendingAmount: l.totalAmount - l.paidAmount
          }))
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-transaction
  static async getTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: 'id is required' });
      const transaction = await RentLedgerService.getTransactionById(id as string);
      res.json({ success: true, data: transaction });
    } catch (err) {
      next(err);
    }
  }

  // GET /get-cash-payment-requests
  static async getCashPaymentRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, tenantId, status, from, to } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { data, total } = await RentLedgerService.getCashPaymentRequests({
        propertyId: propertyId as string,
        tenantId: tenantId as string,
        status: status as string,
        from: from as string,
        to: to as string,
        page,
        limit
      });

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


  // POST /approve-cash-payment-request
  static async approveCashPaymentRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId, action } = req.body;
      const loggedInUserId = (req as any).user.id;
      if (!transactionId) {
        return res.status(400).json({ success: false, message: 'transactionId is required' });
      }
      if (!action || (action !== 'approve' && action !== 'reject')) {
        return res.status(400).json({ success: false, message: 'action must be either "approve" or "reject"' });
      }

      // Verify it's a cash payment
      const PaymentTransaction = (await import('../models/PaymentTransaction')).default;
      const transaction = await PaymentTransaction.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
      if (transaction.paymentMethod !== 'cash') {
        return res.status(400).json({ success: false, message: 'Transaction is not a cash payment' });
      }

      // Enforce action only by the selected manager who received the cash
      if (!transaction.createdById || transaction.createdById.toString() !== loggedInUserId) {
        return res.status(403).json({ 
          success: false, 
          message: `Access denied: only the selected manager who received the cash can ${action} this payment` 
        });
      }

      const result = await RentLedgerService.processCashPaymentRequest(transactionId, action);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
