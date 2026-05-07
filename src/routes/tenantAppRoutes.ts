import { Router } from 'express';
import Controller from '../controllers/TenantAppController';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TenantApp
 *   description: High-performance APIs for the Tenant Mobile Application
 */

// ─── AUTHENTICATION ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/tenant-app/send-otp:
 *   post:
 *     summary: Request login OTP
 *     description: Sends a 4-digit verification code to the tenant's registered mobile number.
 *     tags: [TenantApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber: { type: string, example: "9876543210" }
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/send-otp', Controller.sendOTP);

/**
 * @swagger
 * /api/tenant-app/login:
 *   post:
 *     summary: Verify OTP and Login
 *     description: Authenticates the tenant and returns a JWT access token.
 *     tags: [TenantApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, otp]
 *             properties:
 *               phoneNumber: { type: string }
 *               otp: { type: string, example: "1234" }
 *     responses:
 *       200:
 *         description: Login successful with token
 */
router.post('/login', Controller.login);

// ─── FINANCIALS & PAYMENTS ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/tenant-app/rent-detail:
 *   get:
 *     summary: Get current due bills
 *     description: Returns active rent and deposit items. Amounts > 9999 are auto-split into installments.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bill items
 */
router.get('/rent-detail', jwtAuth, Controller.getRentDetail);

/**
 * @swagger
 * /api/tenant-app/rent-detail/{id}:
 *   get:
 *     summary: Get specific bill breakdown
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detailed bill breakdown
 */
router.get('/rent-detail/:id', jwtAuth, Controller.getRentLedgerDetail);

/**
 * @swagger
 * /api/tenant-app/pay-rent:
 *   post:
 *     summary: Initiate SmePay Payment
 *     description: Generates a secure gateway URL for the specified ledger.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentLedgerId, amount]
 *             properties:
 *               rentLedgerId: { type: string }
 *               amount: { type: number }
 *               paymentType: { type: string, enum: [rent, deposit] }
 *     responses:
 *       201:
 *         description: Payment link generated
 */
router.post('/pay-rent', jwtAuth, Controller.payRent);

/**
 * @swagger
 * /api/tenant-app/transactions:
 *   get:
 *     summary: Payment transaction history
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, partial, paid, overdue, due] }
 */
router.get('/transactions', jwtAuth, Controller.getTransactions);

/**
 * @swagger
 * /api/tenant-app/transaction-detail/{id}:
 *   get:
 *     summary: Get specific transaction details
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.get('/transaction-detail/:id', jwtAuth, Controller.getTransactionDetail);

/**
 * @swagger
 * /api/tenant-app/initiate-cash-payment:
 *   post:
 *     summary: Initiate Cash Payment (OTP to Manager)
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyUserId]
 *             properties:
 *               propertyUserId: { type: string }
 */
router.post('/initiate-cash-payment', jwtAuth, Controller.initiateCashPayment);

/**
 * @swagger
 * /api/tenant-app/verify-cash-payment:
 *   post:
 *     summary: Verify Cash handover via OTP
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyUserId, otp, rentLedgerId, amount]
 *             properties:
 *               propertyUserId: { type: string }
 *               otp: { type: string }
 *               rentLedgerId: { type: string }
 *               amount: { type: number }
 */
router.post('/verify-cash-payment', jwtAuth, Controller.verifyCashPayment);

// ─── SUPPORT & COMPLAINTS ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/tenant-app/complaint:
 *   post:
 *     summary: Raise a new complaint
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category, description]
 *             properties:
 *               title: { type: string }
 *               category: { type: string, enum: [plumbing, electrical, cleaning, maintenance, other] }
 *               description: { type: string }
 */
router.post('/complaint', jwtAuth, Controller.createComplaint);

/**
 * @swagger
 * /api/tenant-app/complaints:
 *   get:
 *     summary: My complaint list
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [open, in-progress, resolved, closed] }
 */
router.get('/complaints', jwtAuth, Controller.getComplaints);

// ─── PROPERTY & ALLOCATION ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/tenant-app/allocation:
 *   get:
 *     summary: Get my Room/Bed details
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 */
router.get('/allocation', jwtAuth, Controller.getAllocation);

/**
 * @swagger
 * /api/tenant-app/announcements:
 *   get:
 *     summary: View property announcements
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 */
router.get('/announcements', jwtAuth, Controller.getAnnouncements);

/**
 * @swagger
 * /api/tenant-app/property-contacts/{propertyId}:
 *   get:
 *     summary: Get Manager contact details
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 */
router.get('/property-contacts/:propertyId', jwtAuth, Controller.getPropertyContacts);

// ─── NOTIFICATIONS & PROFILE ────────────────────────────────────────────────

/**
 * @swagger
 * /api/tenant-app/notifications:
 *   get:
 *     summary: Push notification history
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 */
router.get('/notifications', jwtAuth, Controller.getNotifications);

/**
 * @swagger
 * /api/tenant-app/notifications/{id}/read:
 *   patch:
 *     summary: Mark as read
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.patch('/notifications/:id/read', jwtAuth, Controller.markNotificationRead);

/**
 * @swagger
 * /api/tenant-app/update-onesignal-id:
 *   patch:
 *     summary: Update Push Token (OneSignal)
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oneSignalId]
 *             properties:
 *               oneSignalId: { type: string }
 */
router.patch('/update-onesignal-id', jwtAuth, Controller.updateOneSignalId);

export default router;
