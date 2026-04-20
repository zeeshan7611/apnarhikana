import { Router } from 'express';
import BedController from '../controllers/BedController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Beds
 *   description: Bed management operations
 */

/**
 * @swagger
 * /api/beds/get-beds:
 *   get:
 *     summary: Get all beds
 *     tags: [Beds]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of beds
 */
router.get('/get-beds', authorizePermissions('beds:read'), BedController.getAllBeds);

/**
 * @swagger
 * /api/beds/create-bed:
 *   post:
 *     summary: Create a new bed
 *     tags: [Beds]
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
 *         description: Bed created successfully
 */
router.post('/create-bed', authorizePermissions('beds:write'), BedController.createBed);

/**
 * @swagger
 * /api/beds/get-bed:
 *   get:
 *     summary: Get bed by ID
 *     tags: [Beds]
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
 *         description: Bed details
 *       404:
 *         description: Bed not found
 */
router.get('/get-bed', authorizePermissions('beds:read'), BedController.getBedById);

/**
 * @swagger
 * /api/beds/update-bed:
 *   patch:
 *     summary: Update an existing bed
 *     tags: [Beds]
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
 *         description: Bed updated successfully
 */
router.patch('/update-bed', authorizePermissions('beds:write'), BedController.updateBed);

/**
 * @swagger
 * /api/beds/delete-bed:
 *   delete:
 *     summary: Delete a bed
 *     tags: [Beds]
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
 *         description: Bed deleted successfully
 */
router.delete('/delete-bed', authorizePermissions('beds:write'), BedController.deleteBed);

export default router;