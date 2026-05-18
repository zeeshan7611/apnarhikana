import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  title: string;
  description?: string;
  amount: number;
  category: string;
  date: Date;
  uploadBillImageUrl?: string;
  imageUrl?: string;
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod?: string;
  paidBy?: string;
  paidTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  amount: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  uploadBillImageUrl: { type: String },
  imageUrl: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'PropertyUser', required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  paymentMethod: { type: String },
  paidBy: { type: String },
  paidTo: { type: String },
}, {
  timestamps: true,
});

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
