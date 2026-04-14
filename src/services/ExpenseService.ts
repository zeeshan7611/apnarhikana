import Expense, { IExpense } from '../models/Expense';

export default class ExpenseService {
  static async createExpense(data: any): Promise<IExpense> {
    return Expense.create(data);
  }

  static async getAllExpenses(filters: any = {}): Promise<IExpense[]> {
    return Expense.find(filters)
      .populate('userId', 'name email')
      .populate('propertyId', 'name')
      .sort({ date: -1 });
  }

  static async getExpenseById(id: string): Promise<IExpense | null> {
    return Expense.findById(id)
      .populate('userId', 'name email')
      .populate('propertyId', 'name');
  }

  static async updateExpense(id: string, data: any): Promise<IExpense | null> {
    return Expense.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteExpense(id: string): Promise<IExpense | null> {
    return Expense.findByIdAndDelete(id);
  }

  static async getExpensesByProperty(propertyId: string): Promise<IExpense[]> {
    return Expense.find({ propertyId })
      .populate('userId', 'name email')
      .sort({ date: -1 });
  }
}
