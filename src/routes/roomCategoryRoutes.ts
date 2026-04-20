import { Router } from 'express';
import RoomCategoryController from '../controllers/RoomCategoryController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: RoomCategories
 *   description: Room category management operations
 */

/**
 * @swagger
 * /api/room-categories/create-category:
 *   post:
 *     summary: Create a new room category
 *     tags: [RoomCategories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomCategory, propertyId, basePrice, bedCount]
 *             properties:
 *               roomCategory:
 *                 type: string
 *               propertyId:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               bedCount:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Room category created
 */
router.post('/create-category', authorizePermissions('rooms:write'), RoomCategoryController.create);

/**
 * @swagger
 * /api/room-categories/get-categories:
 *   get:
 *     summary: Get all room categories (with optional filters)
 *     tags: [RoomCategories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of room categories
 */
router.get('/get-categories', authorizePermissions('rooms:read'), RoomCategoryController.getAll);

/**
 * @swagger
 * /api/room-categories/get-category:
 *   get:
 *     summary: Get room category details by ID
 *     tags: [RoomCategories]
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
 *         description: Room category details
 */
router.get('/get-category', authorizePermissions('rooms:read'), RoomCategoryController.getById);

/**
 * @swagger
 * /api/room-categories/update-category:
 *   patch:
 *     summary: Update room category
 *     tags: [RoomCategories]
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
 *               roomCategory:
 *                 type: string
 *               basePrice:
 *                 type: number
 *               bedCount:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Room category updated
 */
router.patch('/update-category', authorizePermissions('rooms:write'), RoomCategoryController.update);

/**
 * @swagger
 * /api/room-categories/delete-category:
 *   delete:
 *     summary: Delete a room category record
 *     tags: [RoomCategories]
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
 *         description: Room category deleted
 */
router.delete('/delete-category', authorizePermissions('rooms:delete'), RoomCategoryController.delete);

export default router;
