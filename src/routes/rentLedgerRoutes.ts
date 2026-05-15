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
 *         schema:
 *           type: string
 *           enum: ["pending","partial","paid","overdue","due"]
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

/**
 * @swagger
 * /api/rent-ledger/get-property-transactions:
 *   get:
 *     summary: Get transactions for a property
 *     description: Returns payment transactions for a property, with optional filters.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema: { type: string }
 *       - in: query
 *         name: tenantId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: paymentType
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string }
 *         description: ISO date string for start date filter
 *       - in: query
 *         name: to
 *         schema: { type: string }
 *         description: ISO date string for end date filter
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of payment transactions
 */
router.get('/get-property-transactions', authorizePermissions('payments:read'), Controller.getPropertyTransactions);

/**
 * @swagger
 * /api/rent-ledger/get-pending-payments:
 *   get:
 *     summary: Get pending rent payments
 *     description: Returns rent ledgers with pending, partial, or overdue status.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema: { type: string }
 *       - in: query
 *         name: tenantId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of pending rent ledgers
 */
router.get('/get-pending-payments', authorizePermissions('payments:read'), Controller.getPendingPayments);

/**
 * @swagger
 * /api/rent-ledger/get-recent-transactions:
 *   get:
 *     summary: Get recent payment transactions
 *     description: Returns the most recent payment transactions, optionally limiting the count.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Recent payment transactions
 */
router.get('/get-recent-transactions', authorizePermissions('payments:read'), Controller.getRecentTransactions);

/**
 * @swagger
 * /api/rent-ledger/get-revenue-stats:
 *   get:
 *     summary: Get current month revenue stats
 *     description: Returns revenue totals and transaction count for the current month.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Current month revenue statistics
 */
router.get('/get-revenue-stats', authorizePermissions('payments:read'), Controller.getRevenueStats);

/**
 * @swagger
 * /api/rent-ledger/get-pending-payment-stats:
 *   get:
 *     summary: Get pending payment statistics
 *     description: Returns counts and amounts for pending payment transactions and due rent ledgers.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Pending payment statistics
 */
router.get('/get-pending-payment-stats', authorizePermissions('payments:read'), Controller.getPendingPaymentStats);

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
 *               type:
 *                 type: string
 *                 enum: ["electricity","water","maintenance","other"]
 *                 default: other
 *               description:  { type: string }
 *               performedById: { type: string }
 *     responses:
 *       200:
 *         description: Extra charge added successfully
 */
router.post('/add-extra-charge', authorizePermissions('payments:write'), Controller.addExtraCharge);

/**
 * @swagger
 * /api/rent-ledger/approve-payment:
 *   post:
 *     summary: Approve a pending payment transaction
 *     description: Marks a pending payment transaction as paid and recalculates the associated ledger.
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
 *         description: Payment approved successfully
 */
router.post('/approve-payment', authorizePermissions('payments:write'), Controller.approvePayment);

/**
 * @swagger
 * /api/rent-ledger/reject-payment:
 *   post:
 *     summary: Reject a pending payment transaction
 *     description: Deletes a pending transaction and recalculates the related ledger.
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
 *         description: Payment rejected successfully
 */
router.post('/reject-payment', authorizePermissions('payments:write'), Controller.rejectPayment);

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
