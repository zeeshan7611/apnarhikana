import { Router } from 'express';
import NotificationController from '../controllers/NotificationController';

const router = Router();

/**
 * @swagger
 * /api/notifications/list:
 *   get:
 *     summary: Get notifications for a property user
 *     description: Returns paginated notifications for a specific propertyUserId, newest first. Also returns unread count.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyUserId
 *         required: true
 *         schema: { type: string }
 *         description: ID of the property user
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated notification list with unreadCount
 *       400:
 *         description: propertyUserId is required
 */
router.get('/list', NotificationController.list);

/**
 * @swagger
 * /api/notifications/mark-read:
 *   patch:
 *     summary: Mark a notification as read
 *     description: Marks a single notification as read by its ID.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [notificationId]
 *             properties:
 *               notificationId:
 *                 type: string
 *                 description: ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       400:
 *         description: notificationId is required
 *       404:
 *         description: Notification not found
 */
router.patch('/mark-read', NotificationController.markRead);

export default router;
