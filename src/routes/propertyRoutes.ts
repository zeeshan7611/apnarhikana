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
 * /api/properties:
 *   get:
 *     summary: Get all properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Property'
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
 * /api/properties/get-bulk-occupancy:
 *   post:
 *     summary: Get bulk occupancy statistics for multiple properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyIds]
 *             properties:
 *               propertyIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: List of occupancy statistics for each property
 */
router.post('/get-bulk-occupancy', authorizePermissions('properties:read'), PropertyController.getBulkOccupancy);

/**
 * @swagger
 * /api/properties/get-property-names:
 *   get:
 *     summary: Get list of property names and IDs
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of properties with name and ID
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 */
router.get('/get-property-names', authorizePermissions('properties:read'), PropertyController.getPropertyNames);

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 */
router.get('/get-property', authorizePermissions('properties:read'), PropertyController.getPropertyById);

/**
 * @swagger
 * /api/properties:
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
 *               isGroundfloor:
 *                 type: boolean
 *                 default: true
 *               description:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 */
router.post('/create-property', authorizePermissions('properties:write'), PropertyController.createProperty);

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update an existing property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               isGroundfloor:
 *                 type: boolean
 *               description:
 *                 type: string
 *               amenities:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Property updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
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


/**
 * @swagger
 * /api/properties/supportdetail:
 *   post:
 *     summary: Update property support and contact details
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyId, contacts]
 *             properties:
 *               propertyId:
 *                 type: string
 *               contacts:
 *                 type: object
 *                 properties:
 *                   managerPhone:   { type: string }
 *                   caretakerPhone: { type: string }
 *                   emergencyPhone: { type: string }
 *                   supportEmail:   { type: string }
 *     responses:
 *       200:
 *         description: Support details updated successfully
 */
router.post('/supportdetail', authorizePermissions('properties:write'), PropertyController.updateSupportDetails);

export default router;