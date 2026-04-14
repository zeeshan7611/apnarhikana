import { Request, Response, NextFunction } from 'express';
import ExpenseService from '../services/ExpenseService';

export default class ExpenseController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await ExpenseService.createExpense({
        ...req.body,
        userId: (req as any).user.id
      });
      res.status(201).json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, category } = req.query;
      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (category) filters.category = category;

      const expenses = await ExpenseService.getAllExpenses(filters);
      res.json({ success: true, data: expenses });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const expense = await ExpenseService.getExpenseById(id as string);
      res.json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const expense = await ExpenseService.updateExpense(id, req.body);
      res.json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      await ExpenseService.deleteExpense(id);
      res.json({ success: true, message: 'Expense deleted' });
    } catch (err) {
      next(err);
    }
  }
}
