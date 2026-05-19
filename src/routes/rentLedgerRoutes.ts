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

/**
 * @swagger
 * /api/rent-ledger/get-cash-payment-requests:
 *   get:
 *     summary: Get cash payment requests
 *     description: Returns cash payment transactions with optional filters for property, tenant, status, and date range.
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
 *         schema:
 *           type: string
 *           enum: ["pending","partial","paid","overdue","due","initiated","rejected"]
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
 *         description: Paginated list of cash payment transactions
 */
router.get('/get-cash-payment-requests', authorizePermissions('payments:read'), Controller.getCashPaymentRequests);

/**
 * @swagger
 * /api/rent-ledger/approve-cash-payment-request:
 *   post:
 *     summary: Process a cash payment request (Approve / Reject)
 *     description: Approves or rejects a cash payment transaction. Recalculates the associated ledger if approved, updates status, and triggers push notifications.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId, action]
 *             properties:
 *               transactionId: { type: string, description: "ID of the cash payment transaction" }
 *               action: { type: string, enum: ["approve", "reject"], description: "Action to take on the cash payment" }
 *     responses:
 *       200:
 *         description: Cash payment processed successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Access denied
 *       404:
 *         description: Transaction not found
 */
router.post('/approve-cash-payment-request', authorizePermissions('payments:write'), Controller.approveCashPaymentRequest);

/**
 * @swagger
 * /api/rent-ledger/trigger-rent-reminder:
 *   post:
 *     summary: Trigger rent reminders for pending/overdue ledgers
 *     description: Send rent reminder notifications to all tenants with pending, partial, or overdue rent. Optionally filter by propertyId and/or month.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyId: { type: string, description: 'Optional property ID to filter reminders' }
 *               month: { type: string, description: 'Optional month to filter reminders (e.g., "2024-05")' }
 *     responses:
 *       200:
 *         description: Rent reminders triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     total: { type: number, description: 'Total pending ledgers found' }
 *                     sent: { type: number, description: 'Number of reminders sent' }
 *                     failed: { type: number, description: 'Number of failed reminders' }
 *       404:
 *         description: No pending rent ledgers found
 */
router.post('/trigger-rent-reminder', authorizePermissions('payments:read'), Controller.triggerRentReminder);

/**
 * @swagger
 * /api/rent-ledger/trigger-single-tenant-reminder:
 *   post:
 *     summary: Trigger rent reminder for a single tenant
 *     description: Send rent reminder notification to a specific tenant for all pending, partial, or overdue rent. Optionally filter by month.
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId]
 *             properties:
 *               tenantId: { type: string, description: 'Tenant ID (required)' }
 *               month: { type: string, description: 'Optional month to filter reminders (e.g., "2024-05")' }
 *     responses:
 *       200:
 *         description: Rent reminder sent successfully to tenant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenantId: { type: string }
 *                     total: { type: number, description: 'Total pending ledgers for tenant' }
 *                     sent: { type: number, description: 'Number of reminders sent' }
 *                     failed: { type: number, description: 'Number of failed reminders' }
 *                     ledgers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ledgerId: { type: string }
 *                           month: { type: string }
 *                           pendingAmount: { type: number }
 *       400:
 *         description: tenantId is required
 *       404:
 *         description: No pending rent ledgers found for this tenant
 */
router.post('/trigger-single-tenant-reminder', authorizePermissions('payments:read'), Controller.triggerSingleTenantReminder);

export default router;
