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

export default router;
