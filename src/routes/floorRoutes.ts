import { Router } from 'express';
import FloorController from '../controllers/FloorController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Floors
 *   description: Floor management operations
 */

/**
 * @swagger
 * /api/floors/create-floor:
 *   post:
 *     summary: Create a new floor
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Floor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Floor'
 */
router.post('/create-floor', authorizePermissions('floors:write'), FloorController.createFloor);

/**
 * @swagger
 * /api/floors/get-floors:
 *   get:
 *     summary: Get all floors
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of floors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Floor'
 */
router.get('/get-floors', authorizePermissions('floors:read'), FloorController.getAllFloors);

/**
 * @swagger
 * /api/floors/get-floor:
 *   get:
 *     summary: Get floor by ID
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Floor details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Floor'
 *       404:
 *         description: Floor not found
 */
router.get('/get-floor', authorizePermissions('floors:read'), FloorController.getFloorById);

/**
 * @swagger
 * /api/floors/update-floor:
 *   put:
 *     summary: Update an existing floor
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Floor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Floor'
 */
router.put('/update-floor', authorizePermissions('floors:write'), FloorController.updateFloor);

/**
 * @swagger
 * /api/floors/delete-floor:
 *   delete:
 *     summary: Delete a floor
 *     tags: [Floors]
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
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Floor deleted successfully
 */
router.delete('/delete-floor', authorizePermissions('floors:write'), FloorController.deleteFloor);

export default router;