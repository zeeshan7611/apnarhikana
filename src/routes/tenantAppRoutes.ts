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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 otp: { type: string, description: "OTP code (dev/testing only)" }
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenant: { type: object }
 *                     allocation: { type: object, nullable: true }
 *                     token: { type: string, description: "JWT access token" }
 */
router.post('/login', Controller.login);

/**
 * @swagger
 * /api/tenant-app/payment-webhook:
 *   post:
 *     summary: SmePay Webhook Handler
 *     description: Endpoint for SmePay to send payment status updates.
 *     tags: [TenantApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ref_id: { type: string }
 *               transaction_id: { type: string }
 *               status:
 *                 type: string
 *                 enum: ["SUCCESS","FAILED","PENDING"]
 *               amount: { type: string }
 *     responses:
 *       200:
 *         description: Webhook processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean }
 *                 message: { type: string }
 */
router.post('/payment-webhook', Controller.paymentWebhook);

// ─── FINANCIALS & PAYMENTS ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/tenant-app/rent-detail:
 *   get:
 *     summary: Get current due bills
 *     description: Returns active rent and deposit items. Amounts > 9999 are auto-split into installments. Now includes rentLedgerId for tracking.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bill items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title: { type: string }
 *                   amount: { type: number }
 *                   type:
 *                     type: string
 *                     enum: ["rent","deposit","extra_charge"]
 *                   rentLedgerId: { type: string, nullable: true }
 *                   dueDate: { type: string, format: date-time, nullable: true }
 *                   status:
 *                     type: string
 *                     enum: ["initiated","due","overdue"]
 *                     description: "initiated = payment pending approval; overdue = past due date; due = not yet due"
 */
router.get('/rent-detail', jwtAuth, Controller.getRentDetail);

/**
 * @swagger
 * /api/tenant-app/rent-ledger-detail:
 *   get:
 *     summary: Get specific bill breakdown
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detailed bill breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     month: { type: string, example: "2026-05" }
 *                     rentAmount: { type: number }
 *                     extraChargesAmount: { type: number }
 *                     totalAmount: { type: number }
 *                     paidAmount: { type: number }
 *                     pendingAmount: { type: number }
 *                     status: { type: string }
 */
router.get('/rent-ledger-detail', jwtAuth, Controller.getRentLedgerDetail);

/**
 * @swagger
 * /api/tenant-app/pay-rent:
 *   post:
 *     summary: Initiate SmePay Payment
 *     description: Creates an order and initiates payment to get UPI links and QR code.
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
 *               paymentType:
 *                 type: string
 *                 enum: ["rent","deposit","extra_charge"]
 *     responses:
 *       201:
 *         description: Payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     order_id: { type: string }
 *                     slug: { type: string }
 *                     payment_link: { type: string }
 *                     qr_code: { type: string }
 *                     intents:
 *                       type: object
 *                       properties:
 *                         gpay: { type: string }
 *                         phonepe: { type: string }
 *                         paytm: { type: string }
 *                         bhim: { type: string }
 *                     transaction_id: { type: string, description: "SmePay transaction reference" }
 *                     transactionId: { type: string, description: "Internal transaction reference for status polling" }
 */
router.post('/pay-rent', jwtAuth, Controller.payRent);

/**
 * @swagger
 * /api/tenant-app/check-payment-status:
 *   get:
 *     summary: Poll payment status
 *     description: Returns the current status of a payment transaction. Frontend uses this to know when to close the payment screen.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: transactionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Current transaction status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 status: { type: string, enum: ["pending","paid","failed"] }
 *                 message: { type: string }
 */
router.get('/check-payment-status', jwtAuth, Controller.checkPaymentStatus);

/**
 * @swagger
 * /api/tenant-app/transactions:
 *   get:
 *     summary: Payment transaction history
 *     description: Returns only initiated, paid, and failed transactions. Supports optional month filter.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["initiated","paid","failed"]
 *         description: Filter by transaction status
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           example: "2026-05"
 *         description: Filter by month in YYYY-MM format
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string }
 *                       amount: { type: number }
 *                       status:
 *                         type: string
 *                         enum: ["initiated","paid","failed"]
 *                       paymentMethod: { type: string }
 *                       paymentType: { type: string }
 *                       createdAt: { type: string, format: date-time }
 *                 total: { type: number }
 */
router.get('/transactions', jwtAuth, Controller.getTransactions);

/**
 * @swagger
 * /api/tenant-app/transaction-detail:
 *   get:
 *     summary: Get specific transaction details
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     amount: { type: number }
 *                     status: { type: string }
 *                     paymentMethod: { type: string }
 *                     paidAt: { type: string, format: date-time }
 */
router.get('/transaction-detail', jwtAuth, Controller.getTransactionDetail);

/**
 * @swagger
 * /api/tenant-app/initiate-cash-payment:
 *   post:
 *     summary: Record Cash Payment (Pending Manager Approval)
 *     description: Directly registers a cash payment handover. This creates a pending cash transaction which the property manager can verify and approve.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyUserId, amount, paymentType]
 *             properties:
 *               propertyUserId: { type: string, description: "ID of the manager receiving the cash" }
 *               rentLedgerId: { type: string, description: "Required for rent or extra charge payments" }
 *               amount: { type: number, description: "Cash amount handed over" }
 *               notes: { type: string, description: "Optional notes about the handover" }
 *               paymentType:
 *                 type: string
 *                 enum: ["rent","deposit","extra_charge"]
 *     responses:
 *       200:
 *         description: Cash payment recorded successfully in pending state
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction: { type: object }
 *                     ledger: { type: object, nullable: true }
 */
router.post('/initiate-cash-payment', jwtAuth, Controller.initiateCashPayment);


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
 *               category:
 *                 type: string
 *                 enum: ["plumbing","electrical","cleaning","maintenance","other"]
 *               description: { type: string }
 *               imageUrl: { type: string }
 *               resolutionURI: { type: string }
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     title: { type: string }
 *                     status: { type: string }
 *                     createdAt: { type: string, format: date-time }
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
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["open","in-progress","resolved","closed"]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: ["plumbing","electrical","cleaning","maintenance","other"]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: ["low","medium","high"]
 *     responses:
 *       200:
 *         description: Paginated list of tenant complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 complaints:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       status: { type: string }
 *                       priority: { type: string }
 *                 total: { type: number }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get('/complaints', jwtAuth, Controller.getComplaints);

/**
 * @swagger
 * /api/tenant-app/complaint:
 *   get:
 *     summary: Fetch complaint detail by ID
 *     description: Retrieves the detailed record of a specific complaint belonging to the authenticated tenant.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the complaint
 *     responses:
 *       200:
 *         description: Complaint detail retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *       400:
 *         description: Complaint ID is required
 *       403:
 *         description: Access denied (complaint belongs to another tenant)
 *       404:
 *         description: Complaint not found
 */
router.get('/complaint', jwtAuth, Controller.getComplaintDetail);

// ─── PROPERTY & ALLOCATION ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/tenant-app/allocation:
 *   get:
 *     summary: Get my Room/Bed details
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current tenant allocation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenantId: { type: string }
 *                     propertyId: { type: string }
 *                     floorId: { type: string }
 *                     roomId: { type: string }
 *                     bedId: { type: string }
 *                     status: { type: string }
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
 *     responses:
 *       200:
 *         description: List of announcements for property/floor/room
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       message: { type: string }
 *                       type: { type: string }
 *                       createdAt: { type: string, format: date-time }
 */
router.get('/announcements', jwtAuth, Controller.getAnnouncements);

/**
 * @swagger
 * /api/tenant-app/property-contacts:
 *   get:
 *     summary: Get Manager contact details
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property contact information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     address: { type: string }
 *                     contacts:
 *                       type: object
 *                       properties:
 *                         managerPhone: { type: string }
 *                         supportEmail: { type: string }
 */
router.get('/property-contacts', jwtAuth, Controller.getPropertyContacts);

// ─── NOTIFICATIONS & PROFILE ────────────────────────────────────────────────

/**
 * @swagger
 * /api/tenant-app/notifications:
 *   get:
 *     summary: Push notification history
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       title: { type: string }
 *                       message: { type: string }
 *                       isRead: { type: boolean }
 *                       createdAt: { type: string, format: date-time }
 *                 total: { type: number }
 */
router.get('/notifications', jwtAuth, Controller.getNotifications);

/**
 * @swagger
 * /api/tenant-app/notifications-read:
 *   patch:
 *     summary: Mark as read
 *     tags: [TenantApp]
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
 *               id: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     isRead: { type: boolean }
 */
router.patch('/notifications-read', jwtAuth, Controller.markNotificationRead);

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
 *     responses:
 *       200:
 *         description: OneSignal ID updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 */
router.patch('/update-onesignal-id', jwtAuth, Controller.updateOneSignalId);

/**
 * @swagger
 * /api/tenant-app/accept-agreement:
 *   post:
 *     summary: Accept Rental Agreement
 *     description: Marks the tenant as having accepted the agreement and records the version.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [version]
 *             properties:
 *               version: { type: string, example: "v1.0" }
 *     responses:
 *       200:
 *         description: Agreement accepted successfully
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
 *                     isAgreementAccepted: { type: boolean }
 *                     agreementAcceptedAt: { type: string, format: date-time }
 *                     agreementVersion: { type: string }
 */
router.post('/accept-agreement', jwtAuth, Controller.acceptAgreement);

/**
 * @swagger
 * /api/tenant-app/kyc:
 *   post:
 *     summary: Submit KYC documents
 *     description: Allows tenants to upload Aadhaar, PAN, and other document URLs for verification.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adharCard:
 *                 type: object
 *                 properties:
 *                   adharCardFront: { type: string, description: "URL of Aadhaar Card Front image" }
 *                   adharCardBack: { type: string, description: "URL of Aadhaar Card Back image" }
 *               panCard:
 *                 type: object
 *                 properties:
 *                   panCardFront: { type: string, description: "URL of PAN Card Front image" }
 *               drivingLicence:
 *                 type: object
 *                 properties:
 *                   drivingLicenceFront: { type: string, description: "URL of Driving License Front image" }
 *                   drivingLicenceBack: { type: string, description: "URL of Driving License Back image" }
 *               otherDocument:
 *                 type: object
 *                 properties:
 *                   documentUrl: { type: string, description: "URL of any other supporting document" }
 *               docType: { type: string, example: "Aadhaar Card", description: "Type of KYC document submitted" }
 *               submittedAt: { type: string, example: "10 May 2025", description: "Date/time when submitted" }
 *     responses:
 *       200:
 *         description: KYC documents submitted successfully
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
 *                     kyc: { type: object }
 */
router.post('/kyc', jwtAuth, Controller.updateKYC);

/**
 * @swagger
 * /api/tenant-app/kyc:
 *   get:
 *     summary: View my submitted KYC status and details
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC status and document URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     adharCard:
 *                       type: object
 *                       properties:
 *                         adharCardFront: { type: string }
 *                         adharCardBack: { type: string }
 *                     panCard:
 *                       type: object
 *                       properties:
 *                         panCardFront: { type: string }
 *                     drivingLicence:
 *                       type: object
 *                       properties:
 *                         drivingLicenceFront: { type: string }
 *                         drivingLicenceBack: { type: string }
 *                     otherDocument:
 *                       type: object
 *                       properties:
 *                         documentUrl: { type: string }
 *                     docType: { type: string }
 *                     submittedAt: { type: string }
 *                     status: { type: string, enum: ["pending", "uploaded", "approved", "rejected"] }
 *                     rejectionReason: { type: string }
 */
router.get('/kyc', jwtAuth, Controller.getKYC);

/**
 * @swagger
 * /api/tenant-app/wifi:
 *   get:
 *     summary: Get WiFi credentials for my floor
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WiFi credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     ssid: { type: string }
 *                     password: { type: string }
 *                     notes: { type: string }
 */
router.get('/wifi', jwtAuth, Controller.getWiFi);

/**
 * @swagger
 * /api/tenant-app/property-users:
 *   get:
 *     summary: Get Property Users (Managers/Staff) for Tenant
 *     description: Fetches a list of property users (name, ID, and designation) associated with the tenant's property.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of property users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ID: { type: string }
 *                       Name: { type: string }
 *                       Designation: { type: string }
 */
router.get('/property-users', jwtAuth, Controller.getPropertyUsers);

/**
 * @swagger
 * /api/tenant-app/profile:
 *   get:
 *     summary: Get my profile
 *     description: Returns the authenticated tenant's profile details extracted from the JWT token.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenant profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     fullName: { type: string }
 *                     phoneNumber: { type: string }
 *                     email: { type: string }
 *                     joiningDate: { type: string, format: date-time }
 *                     alternateNumber: { type: string }
 *                     emergencyContactNumber: { type: string }
 *                     homeContactNumber: { type: string }
 *                     profileImage: { type: string }
 *                     isAgreementAccepted: { type: boolean }
 *                     agreementVersion: { type: string }
 *                     kyc:
 *                       type: object
 *                       properties:
 *                         status: { type: string, enum: ["pending","uploaded","approved","rejected"] }
 */
router.get('/profile', jwtAuth, Controller.getProfile);

/**
 * @swagger
 * /api/tenant-app/update-profile:
 *   put:
 *     summary: Update tenant profile details
 *     description: Updates the profile fields of the authenticated tenant, including fullName, email, contact numbers, and profile image.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string }
 *               alternateNumber: { type: string }
 *               emergencyContactNumber: { type: string }
 *               homeContactNumber: { type: string }
 *               profileImage: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 */
router.put('/update-profile', jwtAuth, Controller.updateProfile);

/**
 * @swagger
 * /api/tenant-app/move-out-policy:
 *   get:
 *     summary: Move-out policy, security deposit & refund details
 *     description: Returns the tenant's security deposit status, default notice period (30 days), the full 5-tier refund policy, and current exit info if an exit has already been initiated.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Move-out policy and deposit info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     depositAmount: { type: number, description: "Total security deposit agreed at onboarding" }
 *                     depositPaid: { type: number, description: "Amount already paid" }
 *                     depositRemaining: { type: number, description: "Remaining deposit to be paid" }
 *                     noticePeriodDays: { type: integer, example: 30, description: "Required notice period for full refund" }
 *                     refundPolicy:
 *                       type: array
 *                       description: "Refund tiers based on days of notice given"
 *                       items:
 *                         type: object
 *                         properties:
 *                           minDays: { type: integer }
 *                           maxDays: { type: integer, nullable: true }
 *                           refundPercentage: { type: integer }
 *                           label: { type: string, example: "30+ days notice — Full refund" }
 *                     exitInfo:
 *                       type: object
 *                       nullable: true
 *                       description: "Present only if exit has been initiated"
 *                       properties:
 *                         exitDate: { type: string, format: date-time }
 *                         exitInitiatedAt: { type: string, format: date-time }
 *                         eligibleRefundPercentage: { type: integer }
 *                         eligibleRefundAmount: { type: number }
 *                         noticePeriodServedDays: { type: integer }
 */
router.get('/move-out-policy', jwtAuth, Controller.getMoveOutPolicy);

/**
 * @swagger
 * /api/tenant-app/initiate-exit:
 *   post:
 *     summary: Schedule move-out and calculate security deposit refund
 *     description: Registers notice of exit for the authenticated tenant. The backend calculates the notice period days and sets the eligible refund percentage and refund amount of their security deposit.
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [exitDate]
 *             properties:
 *               exitDate: { type: string, format: date, example: "2026-06-30", description: "The scheduled departure date" }
 *     responses:
 *       200:
 *         description: Exit initiated and refund eligibility calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 */
router.post('/initiate-exit', jwtAuth, Controller.initiateExit);

/**
 * @swagger
 * /api/tenant-app/property-policy:
 *   get:
 *     summary: Get property policy
 *     description: Returns the static property policy including house rules, quiet hours, visitor policy, safety guidelines, check-in/check-out times, and notice period. Also includes the important notice banner.
 *     tags: [TenantApp]
 *     responses:
 *       200:
 *         description: Property policy data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     notice:
 *                       type: object
 *                       properties:
 *                         title: { type: string }
 *                         text: { type: string }
 *                     sections:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           title: { type: string }
 *                           type: { type: string, enum: ["text", "bullets"] }
 *                           content: { type: string, description: "Present when type is text" }
 *                           items:
 *                             type: array
 *                             description: Present when type is bullets
 *                             items:
 *                               type: object
 *                               properties:
 *                                 text: { type: string }
 *                                 allowed: { type: boolean }
 */
router.get('/property-policy', Controller.getPropertyPolicy);

export default router;
