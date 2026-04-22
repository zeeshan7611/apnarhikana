import { Router } from 'express';
import PaymentController from '../controllers/PaymentController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Rent collection and payment tracking
 */

/**
 * @swagger
 * /api/payments/collect-rent:
 *   post:
 *     summary: Record a rent payment for a tenant
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantAllocationId, amount, month, paymentMethod, createdById]
 *             properties:
 *               tenantAllocationId: { type: string }
 *               tenantId:           { type: string }
 *               propertyId:         { type: string }
 *               amount:             { type: number }
 *               month:              { type: string, description: "Format: YYYY-MM" }
 *               paymentMethod:      { type: string, enum: ["cash", "upi", "bank_transfer", "cheque"] }
 *               notes:              { type: string }
 *               createdById:        { type: string }
 *     responses:
 *       201:
 *         description: Payment recorded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 */
router.post('/collect-rent', authorizePermissions('payments:write'), PaymentController.collectRent);

/**
 * @swagger
 * /api/payments/get-payments:
 *   get:
 *     summary: Get all payments with optional filters
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         schema: { type: string }
 *       - in: query
 *         name: propertyId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: month
 *         schema: { type: string }
 *         description: "Format: YYYY-MM"
 *       - in: query
 *         name: createdById
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 */
router.get('/get-payments', authorizePermissions('payments:read'), PaymentController.getAll);

/**
 * @swagger
 * /api/payments/get-payment:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 */
router.get('/get-payment', authorizePermissions('payments:read'), PaymentController.getById);

/**
 * @swagger
 * /api/payments/update-payment:
 *   put:
 *     summary: Update payment details
 *     tags: [Payments]
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
 *               id:            { type: string }
 *               status:        { type: string, enum: ["pending", "paid", "failed", "partial"] }
 *               paymentMethod: { type: string, enum: ["cash", "upi", "bank_transfer", "cheque"] }
 *               notes:         { type: string }
 *               amount:        { type: number }
 *               paidAt:        { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Payment updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 */
router.put('/update-payment', authorizePermissions('payments:write'), PaymentController.update);

export default router;
