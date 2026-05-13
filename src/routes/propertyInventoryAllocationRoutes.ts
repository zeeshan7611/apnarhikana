import { Router } from 'express';
import AllocationController from '../controllers/PropertyInventoryAllocationController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Allocations
 *   description: Property Inventory Allocation management
 */

/**
 * @swagger
 * /api/allocations/get-allocations:
 *   get:
 *     summary: Get all inventory allocations
 *     tags: [Allocations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of allocations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PropertyInventoryAllocation'
 */
router.get('/get-allocations', authorizePermissions('allocations:read'), AllocationController.getAllAllocations);

/**
 * @swagger
 * /api/allocations/get-allocation-by-property-room:
 *   get:
 *     summary: Get all inventory allocations by propertyId and roomId
 *     tags: [Allocations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of allocations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PropertyInventoryAllocation'
 */
router.get('/get-allocation-by-property-room', authorizePermissions('allocations:read'), AllocationController.getAllocationsByPropertyAndRoom);

/**
 * @swagger
 * /api/allocations/get-allocation-by-property:
 *   get:
 *     summary: Get all inventory allocations by propertyId
 *     tags: [Allocations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of allocations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PropertyInventoryAllocation'
 */
router.get('/get-allocation-by-property', authorizePermissions('allocations:read'), AllocationController.getAllocationsByPropertyId);

/**
 * @swagger
 * /api/allocations/create-allocation:
 *   post:
 *     summary: Create a single inventory allocation
 *     tags: [Allocations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyId, floorId, roomId, bedId, roomCategoryId]
 *             properties:
 *               propertyId: { type: string }
 *               floorId: { type: string }
 *               roomId: { type: string }
 *               bedId: { type: string }
 *               roomCategoryId: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Allocation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyInventoryAllocation'
 */
router.post('/create-allocation', authorizePermissions('allocations:write'), AllocationController.createAllocation);

/**
 * @swagger
 * /api/allocations/create-batch-allocation:
 *   post:
 *     summary: Batch create inventory allocations (automatic bed assignment)
 *     tags: [Allocations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required: [propertyId, floorId, roomId, roomCategoryId]
 *               properties:
 *                 propertyId: { type: string }
 *                 floorId: { type: string }
 *                 roomId: { type: string }
 *                 roomCategoryId: { type: string }
 *                 notes: { type: string }
 *     responses:
 *       201:
 *         description: Allocations created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PropertyInventoryAllocation'
 */
router.post('/create-batch-allocation', authorizePermissions('allocations:write'), AllocationController.createBatch);

/**
 * @swagger
 * /api/allocations/get-allocation:
 *   get:
 *     summary: Get inventory allocation by ID
 *     tags: [Allocations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Allocation details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyInventoryAllocation'
 *       404:
 *         description: Allocation not found
 */
router.get('/get-allocation', authorizePermissions('allocations:read'), AllocationController.getAllocationById);

/**
 * @swagger
 * /api/allocations/update-allocation:
 *   put:
 *     summary: Update an existing allocation
 *     tags: [Allocations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id: { type: string }
 *               notes: { type: string }
 *               status:
 *                 type: string
 *                 enum: ["active","inactive","terminated"]
 *     responses:
 *       200:
 *         description: Allocation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyInventoryAllocation'
 */
router.put('/update-allocation', authorizePermissions('allocations:write'), AllocationController.updateAllocation);

/**
 * @swagger
 * /api/allocations/delete-allocation:
 *   delete:
 *     summary: Delete an allocation
 *     tags: [Allocations]
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
 *         description: Allocation deleted successfully
 */
router.delete('/delete-allocation', authorizePermissions('allocations:write'), AllocationController.deleteAllocation);

export default router;