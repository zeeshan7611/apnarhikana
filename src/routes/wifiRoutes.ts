import { Router } from 'express';
import Controller from '../controllers/WiFiController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: WiFi
 *   description: WiFi management for properties and floors
 */

/**
 * @swagger
 * /api/wifi:
 *   post:
 *     summary: Create or update WiFi details
 *     tags: [WiFi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyId, floorId, ssid, password]
 *             properties:
 *               propertyId: { type: string }
 *               floorId: { type: string }
 *               ssid: { type: string }
 *               password: { type: string }
 *               notes: { type: string }
 */
router.post('/', Controller.upsertWiFi);

/**
 * @swagger
 * /api/wifi/get-wifi-by-property:
 *   get:
 *     summary: Get all WiFi for a property
 *     tags: [WiFi]
 *     security:
 *       - bearerAuth: []
 */
router.get('/get-wifi-by-property', authorizePermissions('properties:read'), Controller.getByProperty);

/**
 * @swagger
 * /api/wifi/delete-wifi:
 *   delete:
 *     summary: Delete WiFi details
 *     tags: [WiFi]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/delete-wifi', authorizePermissions('properties:write'), Controller.deleteWiFi);

export default router;
