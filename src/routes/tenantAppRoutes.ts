import { Router } from 'express';
import Controller from '../controllers/TenantAppController';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TenantApp
 *   description: APIs for the Tenant Mobile Application
 */

// ─── AUTH ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/tenant-app/send-otp:
 *   post:
 *     summary: Send OTP to tenant mobile number
 *     tags: [TenantApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber: { type: string }
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post('/send-otp', Controller.sendOTP);

/**
 * @swagger
 * /api/tenant-app/login:
 *   post:
 *     summary: Login with mobile and OTP
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
 *               otp: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, returns token and allocation
 */
router.post('/login', Controller.login);

// ─── PROTECTED ROUTES ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/tenant-app/rent-detail:
 *   get:
 *     summary: Get upcoming/current month rent detail
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rent details
 */
router.get('/rent-detail', jwtAuth, Controller.getRentDetail);

/**
 * @swagger
 * /api/tenant-app/complaint:
 *   post:
 *     summary: Create a new complaint
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, category]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               category: { type: string, enum: [plumbing, electrical, cleaning, maintenance, other] }
 *     responses:
 *       201:
 *         description: Complaint created
 */
router.post('/complaint', jwtAuth, Controller.createComplaint);

/**
 * @swagger
 * /api/tenant-app/allocation:
 *   get:
 *     summary: Get complete tenant allocation details
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Allocation details
 */
router.get('/allocation', jwtAuth, Controller.getAllocation);

/**
 * @swagger
 * /api/tenant-app/announcements:
 *   get:
 *     summary: Get recent announcements for the tenant's context
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of announcements
 */
router.get('/announcements', jwtAuth, Controller.getAnnouncements);

/**
 * @swagger
 * /api/tenant-app/complaints:
 *   get:
 *     summary: Get complaints (tenant wise with pagination)
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
 *     responses:
 *       200:
 *         description: List of complaints
 */
router.get('/complaints', jwtAuth, Controller.getComplaints);

/**
 * @swagger
 * /api/tenant-app/transactions:
 *   get:
 *     summary: Get payment transaction history (tenant wise with pagination)
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
 *     responses:
 *       200:
 *         description: Transaction history
 */
router.get('/transactions', jwtAuth, Controller.getTransactions);

/**
 * @swagger
 * /api/tenant-app/property-contacts/{propertyId}:
 *   get:
 *     summary: Get property contact details property wise
 *     tags: [TenantApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property contact details
 */
router.get('/property-contacts/:propertyId', jwtAuth, Controller.getPropertyContacts);

/**
 * @swagger
 * /api/tenant-app/notifications:
 *   get:
 *     summary: Get notifications for tenant (paginated)
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
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/notifications', jwtAuth, Controller.getNotifications);

/**
 * @swagger
 * /api/tenant-app/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
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
 *         description: Notification updated
 */
router.patch('/notifications/:id/read', jwtAuth, Controller.markNotificationRead);

export default router;
