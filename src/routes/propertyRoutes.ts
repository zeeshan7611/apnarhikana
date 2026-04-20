import { Router } from 'express';
import PropertyController from '../controllers/PropertyController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Property management operations
 */

/**
 * @swagger
 * /api/properties/get-properties:
 *   get:
 *     summary: Get all properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of properties
 */
router.get('/get-properties', authorizePermissions('properties:read'), PropertyController.getAllProperties);

/**
 * @swagger
 * /api/properties/get-occupancy:
 *   get:
 *     summary: Get occupancy percentage and stats
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Optional property filter
 *     responses:
 *       200:
 *         description: Occupancy statistics
 */
router.get('/get-occupancy', authorizePermissions('properties:read'), PropertyController.getOccupancy);

/**
 * @swagger
 * /api/properties/get-property:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 */
router.get('/get-property', authorizePermissions('properties:read'), PropertyController.getPropertyById);

/**
 * @swagger
 * /api/properties/create-property:
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, location, numberOfFloors, numberOfRooms]
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               location:
 *                 type: string
 *               numberOfFloors:
 *                 type: number
 *               numberOfRooms:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Property created successfully
 */
router.post('/create-property', authorizePermissions('properties:write'), PropertyController.createProperty);

/**
 * @swagger
 * /api/properties/update-property:
 *   patch:
 *     summary: Update an existing property
 *     tags: [Properties]
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
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               location:
 *                 type: string
 *               numberOfFloors:
 *                 type: number
 *               numberOfRooms:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Property updated successfully
 */
router.patch('/update-property', authorizePermissions('properties:write'), PropertyController.updateProperty);

/**
 * @swagger
 * /api/properties/delete-property:
 *   delete:
 *     summary: Delete a property
 *     tags: [Properties]
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
 *         description: Property deleted successfully
 */
router.delete('/delete-property', authorizePermissions('properties:write'), PropertyController.deleteProperty);

export default router;