import { Request, Response, NextFunction } from 'express';
import PaymentService from '../services/PaymentService';

export default class PaymentController {
  static async collectRent(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await PaymentService.collectRent({
        ...req.body,
        createdById: (req as any).user.id
      });
      res.status(201).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await PaymentService.getAllPayments(req.query);
      res.json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const payment = await PaymentService.getPaymentById(id as string);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const payment = await PaymentService.updatePayment(id, req.body);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }
}
