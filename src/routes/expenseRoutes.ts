import { Router } from 'express';
import ExpenseController from '../controllers/ExpenseController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Property expense management operations
 */

/**
 * @swagger
 * /api/expenses/create-expense:
 *   post:
 *     summary: Record a new expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, amount, category, propertyId]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               uploadBillImageUrl:
 *                 type: string
 *               propertyId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               paidBy:
 *                 type: string
 *               paidTo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Expense recorded
 */
router.post('/create-expense', authorizePermissions('expenses:write'), ExpenseController.create);

/**
 * @swagger
 * /api/expenses/get-expenses:
 *   get:
 *     summary: Get all expenses (with optional filters)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of expenses
 */
router.get('/get-expenses', authorizePermissions('expenses:read'), ExpenseController.getAll);

/**
 * @swagger
 * /api/expenses/get-expense:
 *   get:
 *     summary: Get expense details by ID
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Expense details
 */
router.get('/get-expense', authorizePermissions('expenses:read'), ExpenseController.getById);

/**
 * @swagger
 * /api/expenses/update-expense:
 *   patch:
 *     summary: Update an existing expense details
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *               paidBy:
 *                 type: string
 *               paidTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Expense updated
 */
router.patch('/update-expense', authorizePermissions('expenses:write'), ExpenseController.update);

/**
 * @swagger
 * /api/expenses/delete-expense:
 *   delete:
 *     summary: Delete an expense record
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Expense deleted
 */
router.delete('/delete-expense', authorizePermissions('expenses:delete'), ExpenseController.delete);

export default router;
