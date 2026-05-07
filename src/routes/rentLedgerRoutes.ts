import { Router } from 'express';
import Controller from '../controllers/RentLedgerController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: RentLedger
 *   description: Management APIs for Rent, Billing, and Payments
 */

// ─── 1. CREATE MONTHLY LEDGER ───────────────────────────────────────────────
/**
 * @swagger
 * /api/rent-ledger/generate-monthly-ledgers:
 *   post:
 *     summary: Bulk generate monthly bills
 *     description: Automatically creates rent ledgers for all active tenants for the specified month. Skips tenants who already have a bill for that month.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [performedById]
 *             properties:
 *               performedById: { type: string, description: "ID of the staff triggering generation" }
 *               targetMonth:   { type: string, example: "2025-06", description: "Format: YYYY-MM. Defaults to current month." }
 *     responses:
 *       200:
 *         description: Ledgers generated successfully
 */
router.post('/generate-monthly-ledgers', authorizePermissions('payments:write'), Controller.generateMonthlyLedgers);

// ─── 2. GET PAYMENT HISTORY ─────────────────────────────────────────────────
/**
 * @swagger
 * /api/rent-ledger/get-payment-history:
 *   get:
 *     summary: View transaction audit trail
 *     description: Retrieves a filtered list of all payment transactions (Rent/Deposit) across the property.
 *     tags: [RentLedger]
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
 *         schema: { type: string, enum: [pending, partial, paid, overdue, due] }
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/get-payment-history', authorizePermissions('payments:read'), Controller.getPaymentHistory);

/**
 * @swagger
 * /api/rent-ledger/get-transaction:
 *   get:
 *     summary: Get detailed transaction record
 *     description: Fetches a single transaction with populated tenant and property details.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaction detail object
 */
router.get('/get-transaction', authorizePermissions('payments:read'), Controller.getTransaction);

// ─── 3. ADD EXTRA CHARGE ────────────────────────────────────────────────────
/**
 * @swagger
 * /api/rent-ledger/add-extra-charge:
 *   post:
 *     summary: Add utility or maintenance charge
 *     description: Appends an extra charge (Electricity, Water, etc.) to a tenant's bill and automatically updates the total amount due.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentLedgerId, title, amount, performedById]
 *             properties:
 *               rentLedgerId: { type: string }
 *               title:        { type: string, example: "Electricity - June" }
 *               amount:       { type: number }
 *               type:         { type: string, enum: [electricity, water, maintenance, other], default: other }
 *               description:  { type: string }
 *               performedById: { type: string }
 */
router.post('/add-extra-charge', authorizePermissions('payments:write'), Controller.addExtraCharge);

// ─── 4. MARK PAYMENT COMPLETED (GATEWAY) ───────────────────────────────────
/**
 * @swagger
 * /api/rent-ledger/complete-payment:
 *   post:
 *     summary: Verify and approve a payment
 *     description: Marks a pending transaction as 'paid' and triggers a recalculation of the tenant's ledger balance.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId]
 *             properties:
 *               transactionId: { type: string }
 *     responses:
 *       200:
 *         description: Payment successfully verified
 */
router.post('/complete-payment', authorizePermissions('payments:write'), Controller.completePayment);

export default router;
