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
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: any = {};
      if (propertyId) filters.propertyId = propertyId;
      if (category) filters.category = category;

      const { data, total } = await ExpenseService.getAllExpenses(filters, page, limit);
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
      const expense = await ExpenseService.getExpenseById(id as string);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const expense = await ExpenseService.updateExpense(id, req.body);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;
      const expense = await ExpenseService.deleteExpense(id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json({ success: true, message: "Expense deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
