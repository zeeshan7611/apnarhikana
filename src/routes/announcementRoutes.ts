import { Router } from 'express';
import AnnouncementController from '../controllers/AnnouncementController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Announcements
 *   description: Tenant announcements and push notification operations
 */

/**
 * @swagger
 * /api/announcements/create-announcement:
 *   post:
 *     summary: Broadcast an announcement (Sent via OneSignal)
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message, sentBy]
 *             properties:
 *               title: { type: string }
 *               message: { type: string }
 *               tenantId: { type: string, description: Target a specific tenant }
 *               propertyId: { type: string, description: Target an entire property }
 *               floorId: { type: string, description: Target an entire floor }
 *               roomId: { type: string, description: Target an entire room }
 *               type: { type: string, enum: [announcement, notification, emergency] }
 *               sentBy: { type: string, description: ID of the user sending the announcement }
 *     responses:
 *       201:
 *         description: Announcement broadcasted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 */
router.post('/create-announcement', authorizePermissions('announcements:write'), AnnouncementController.create);

/**
 * @swagger
 * /api/announcements/get-announcements:
 *   get:
 *     summary: Get all previous announcements
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: sentBy
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 */
router.get('/get-announcements', authorizePermissions('announcements:read'), AnnouncementController.getAll);

export default router;
