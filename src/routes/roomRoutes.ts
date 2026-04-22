import { Router } from 'express';
import RoomController from '../controllers/RoomController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Room management operations
 */

/**
 * @swagger
 * /api/rooms/create-room:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, roomCode]
 *             properties:
 *               name:
 *                 type: string
 *               roomCode:
 *                 type: string
 *               keyNumber:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 */
router.post('/create-room', authorizePermissions('rooms:write'), RoomController.createRoom);

/**
 * @swagger
 * /api/rooms/get-rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
router.get('/get-rooms', authorizePermissions('rooms:read'), RoomController.getAllRooms);

/**
 * @swagger
 * /api/rooms/get-room:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
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
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Room not found
 */
router.get('/get-room', authorizePermissions('rooms:read'), RoomController.getRoomById);

/**
 * @swagger
 * /api/rooms/update-room:
 *   put:
 *     summary: Update an existing room
 *     tags: [Rooms]
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
 *               roomCode:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 */
router.put('/update-room', authorizePermissions('rooms:write'), RoomController.updateRoom);

/**
 * @swagger
 * /api/rooms/delete-room:
 *   delete:
 *     summary: Delete a room
 *     tags: [Rooms]
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
 *         description: Room deleted successfully
 */
router.delete('/delete-room', authorizePermissions('rooms:write'), RoomController.deleteRoom);

/**
 * @swagger
 * /api/rooms/get-rooms-by-property:
 *   get:
 *     summary: Get rooms based on property room count
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
router.get('/get-rooms-by-property', authorizePermissions('rooms:read'), RoomController.getRoomsByProperty);

export default router;
