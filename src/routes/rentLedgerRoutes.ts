import { Router } from 'express';
import Controller from '../controllers/RentLedgerController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: RentLedger
 *   description: Monthly rent billing, payments, late fees and audit trail
 */

// ─── CREATE LEDGER ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/create-ledger:
 *   post:
 *     summary: Create a monthly rent ledger (bill) for a tenant
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId, propertyId, tenantAllocationId, month, rentAmount, dueDate, createdById]
 *             properties:
 *               tenantId:           { type: string }
 *               propertyId:         { type: string }
 *               tenantAllocationId: { type: string }
 *               month:              { type: string, example: "2025-05", description: "Format: YYYY-MM" }
 *               rentAmount:         { type: number }
 *               lateFee:            { type: number, default: 0 }
 *               dueDate:            { type: string, format: date-time }
 *               createdById:        { type: string }
 *     responses:
 *       201:
 *         description: Ledger created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:    { $ref: '#/components/schemas/RentLedger' }
 */
router.post('/create-ledger', authorizePermissions('payments:write'), Controller.createLedger);

// ─── RECORD PAYMENT ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/record-payment:
 *   post:
 *     summary: Record a payment (partial or full) against a ledger
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentLedgerId, tenantId, propertyId, amount, paymentMethod, createdById]
 *             properties:
 *               rentLedgerId:        { type: string }
 *               tenantId:            { type: string }
 *               propertyId:          { type: string }
 *               amount:              { type: number }
 *               paymentMethod:       { type: string, enum: [cash, upi, bank_transfer, cheque] }
 *               referenceNumber:     { type: string, description: "Cheque or bank reference number" }
 *               utrNumber:           { type: string, description: "UTR number for UPI / bank transfers" }
 *               paymentScreenshotUrl: { type: string, description: "URL of the uploaded payment screenshot" }
 *               notes:               { type: string }
 *               createdById:         { type: string }
 *     responses:
 *       201:
 *         description: Payment recorded. Ledger status auto-updated to partial or paid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     ledger:      { $ref: '#/components/schemas/RentLedger' }
 *                     transaction: { $ref: '#/components/schemas/PaymentTransaction' }
 */
router.post('/record-payment', authorizePermissions('payments:write'), Controller.recordPayment);

// ─── APPROVE PAYMENT ────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/rent-ledger/approve-payment:
 *   post:
 *     summary: Approve a pending payment transaction
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId, performedById]
 *             properties:
 *               transactionId: { type: string }
 *               performedById: { type: string }
 *     responses:
 *       200:
 *         description: Payment approved.
 */
router.post('/approve-payment', authorizePermissions('payments:write'), Controller.approvePayment);

// ─── REJECT PAYMENT ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/rent-ledger/reject-payment:
 *   post:
 *     summary: Reject a pending payment transaction
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId, performedById]
 *             properties:
 *               transactionId: { type: string }
 *               performedById: { type: string }
 *               notes:         { type: string, description: "Reason for rejection" }
 *     responses:
 *       200:
 *         description: Payment rejected.
 */
router.post('/reject-payment', authorizePermissions('payments:write'), Controller.rejectPayment);

// ─── APPLY LATE FEE ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/apply-late-fee:
 *   post:
 *     summary: Apply a late fee to an existing ledger
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentLedgerId, lateFee, performedById]
 *             properties:
 *               rentLedgerId:  { type: string }
 *               lateFee:       { type: number }
 *               performedById: { type: string }
 *     responses:
 *       200:
 *         description: Late fee applied, totalAmount updated
 */
router.post('/apply-late-fee', authorizePermissions('payments:write'), Controller.applyLateFee);

// ─── ADD EXTRA CHARGE ────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/rent-ledger/add-extra-charge:
 *   post:
 *     summary: Add an extra charge (electricity, water, etc.) to a ledger
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentLedgerId, chargeType, amount, description, performedById]
 *             properties:
 *               rentLedgerId: { type: string }
 *               chargeType:   { type: string, enum: [electricity, water, maintenance, other] }
 *               amount:       { type: number }
 *               description:  { type: string }
 *               metadata:     { type: object, description: "Optional units, rates, etc." }
 *               performedById: { type: string }
 *     responses:
 *       201:
 *         description: Extra charge added successfully
 */
router.post('/add-extra-charge', authorizePermissions('payments:write'), Controller.addExtraCharge);

// ─── REMOVE EXTRA CHARGE ─────────────────────────────────────────────────────
/**
 * @swagger
 * /api/rent-ledger/remove-extra-charge:
 *   post:
 *     summary: Remove an extra charge from a ledger
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chargeId, performedById]
 *             properties:
 *               chargeId:      { type: string }
 *               performedById: { type: string }
 *     responses:
 *       200:
 *         description: Extra charge removed
 */
router.post('/remove-extra-charge', authorizePermissions('payments:write'), Controller.removeExtraCharge);

// ─── MARK OVERDUE ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/mark-overdue:
 *   post:
 *     summary: Bulk-mark all pending/partial ledgers past their due date as overdue
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
 *               performedById: { type: string }
 *     responses:
 *       200:
 *         description: Count of ledgers marked overdue
 */
router.post('/mark-overdue', authorizePermissions('payments:write'), Controller.markOverdue);

// ─── GET LEDGERS ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/get-ledgers:
 *   get:
 *     summary: Get all rent ledgers with optional filters
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
 *         name: month
 *         schema: { type: string }
 *         description: "Format: YYYY-MM"
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, partial, paid, overdue] }
 *     responses:
 *       200:
 *         description: List of rent ledgers
 */
router.get('/get-ledgers', authorizePermissions('payments:read'), Controller.getLedgers);

// ─── GET PAYMENT HISTORY (CATEGORIZED) ───────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/get-payment-history:
 *   get:
 *     summary: Get rent ledgers filtered by payment category (paid, overdue, due)
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
 *         name: category
 *         schema: { type: string, enum: [paid, overdue, due, all] }
 *         description: "due includes both pending and partial statuses"
 *     responses:
 *       200:
 *         description: List of rent ledgers in the specified category
 */
router.get('/get-payment-history', authorizePermissions('payments:read'), Controller.getPaymentHistory);

// ─── GET SINGLE LEDGER ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/get-ledger:
 *   get:
 *     summary: Get a single rent ledger by ID
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
 *         description: Rent ledger detail
 *       404:
 *         description: Ledger not found
 */
router.get('/get-ledger', authorizePermissions('payments:read'), Controller.getLedgerById);

// ─── GET TRANSACTIONS ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/get-transactions:
 *   get:
 *     summary: Get all payment transactions for a ledger
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rentLedgerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of payment transactions
 *       400:
 *         description: rentLedgerId is required
 */
router.get('/get-transactions', authorizePermissions('payments:read'), Controller.getTransactions);

// ─── GET PENDING PAYMENTS ───────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/get-pending-payments:
 *   get:
 *     summary: Get all pending payment transactions (optional property filter)
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: false
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of pending payment transactions
 */
router.get('/get-pending-payments', authorizePermissions('payments:read'), Controller.getPendingPayments);

// ─── GET ALL/STATUS-WISE TRANSACTIONS ────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/get-property-transactions:
 *   get:
 *     summary: Get all payment transactions (optional property and status filters)
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: false
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         required: false
 *         schema: { type: string, enum: [approved, rejected, pending] }
 *     responses:
 *       200:
 *         description: List of payment transactions
 */
router.get('/get-property-transactions', authorizePermissions('payments:read'), Controller.getPropertyTransactions);

// ─── GET RECENT TRANSACTIONS (DASHBOARD) ────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/get-recent-transactions:
 *   get:
 *     summary: Get recent payment transactions across all properties
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         required: false
 *         schema: { type: string, enum: [approved, rejected, pending] }
 *     responses:
 *       200:
 *         description: List of recent transactions
 */
router.get('/get-recent-transactions', authorizePermissions('payments:read'), Controller.getRecentTransactions);

// ─── GET AUDIT LOGS ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/get-logs:
 *   get:
 *     summary: Get full audit log for a rent ledger
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rentLedgerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Audit log entries
 *       400:
 *         description: rentLedgerId is required
 */
router.get('/get-logs', authorizePermissions('payments:read'), Controller.getLogs);

// ─── GET EXTRA CHARGES ───────────────────────────────────────────────────────
/**
 * @swagger
 * /api/rent-ledger/get-extra-charges:
 *   get:
 *     summary: Get all extra charges for a ledger
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rentLedgerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of extra charges
 */
router.get('/get-extra-charges', authorizePermissions('payments:read'), Controller.getExtraCharges);

// ─── GENERATE MONTHLY LEDGERS ─────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/generate-monthly-ledgers:
 *   post:
 *     summary: "Generate rent ledgers for all active tenants for a given month (monthly trigger)"
 *     description: "Safe to call multiple times — skips tenants who already have a ledger for the month. Call on 1st of every month."
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
 *               performedById: { type: string, description: "ID of the property user triggering this" }
 *               targetMonth:   { type: string, example: "2025-06", description: "Format: YYYY-MM. Defaults to current month if not provided." }
 *     responses:
 *       200:
 *         description: Ledgers generated
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
 *                     created: { type: number, description: "Number of new ledgers created" }
 *                     skipped: { type: number, description: "Number skipped (already existed)" }
 */
router.post('/generate-monthly-ledgers', authorizePermissions('payments:write'), Controller.generateMonthlyLedgers);

// ─── SYNC ALL LEDGERS ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/sync-all-ledgers:
 *   post:
 *     summary: "Sync missing ledgers for all active tenants from their joining date to current month"
 *     description: "Ensures no tenant is missing historical or current month ledgers. Safe to call multiple times."
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
 *               performedById: { type: string, description: "ID of the property user triggering this" }
 *     responses:
 *       200:
 *         description: Sync complete
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
 *                     totalAllocations: { type: number }
 *                     ledgersCreated:   { type: number }
 */
router.post('/sync-all-ledgers', authorizePermissions('payments:write'), Controller.syncAllLedgers);

// ─── CANCEL TENANT LEDGERS (on termination) ───────────────────────────────────

/**
 * @swagger
 * /api/rent-ledger/cancel-tenant-ledgers:
 *   post:
 *     summary: Cancel all future pending ledgers when a tenant leaves
 *     description: "Deletes all pending (unpaid) ledgers for a tenant from the month after currentMonth onwards. Paid/partial ledgers are preserved."
 *     tags: [RentLedger]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId, performedById]
 *             properties:
 *               tenantId:      { type: string }
 *               performedById: { type: string }
 *               currentMonth:  { type: string, example: "2025-06", description: "Format: YYYY-MM. Ledgers after this month are cancelled. Defaults to current month." }
 *     responses:
 *       200:
 *         description: Future pending ledgers cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:   { type: boolean }
 *                 message:   { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     cancelled: { type: number }
 */
router.post('/cancel-tenant-ledgers', authorizePermissions('payments:write'), Controller.cancelTenantLedgers);

export default router;

