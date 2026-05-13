import { Router } from 'express';
import TenantAllocationController from '../controllers/TenantAllocationController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TenantAllocations
 *   description: Tenant room and bed allocation management
 */

/**
 * @swagger
 * /api/tenant-allocations/create-allocation:
 *   post:
 *     summary: Allocate a room/bed to a tenant (Direct Mapping)
 *     tags: [TenantAllocations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId, inventoryAllocationId, propertyId, floorId, roomId, bedId, roomCategoryId, rentAmount, depositAmount, startDate]
 *             properties:
 *               tenantId: { type: string }
 *               inventoryAllocationId: { type: string }
 *               propertyId: { type: string }
 *               floorId: { type: string }
 *               roomId: { type: string }
 *               bedId: { type: string }
 *               roomCategoryId: { type: string }
 *               rentAmount: { type: number }
 *               depositAmount: { type: number }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Allocation created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TenantAllocation'
 */
router.post('/create-allocation', authorizePermissions('allocations:write'), TenantAllocationController.create);

/**
 * @swagger
 * /api/tenant-allocations/create-complete-allocation:
 *   post:
 *     summary: Create a tenant and allocate room/bed in one step
 *     tags: [TenantAllocations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phoneNumber, email, joiningDate, propertyId, roomId, bedId, rentAmount, depositAmount]
 *             properties:
 *               fullName: { type: string }
 *               phoneNumber: { type: string }
 *               email: { type: string }
 *               joiningDate: { type: string, format: date }
 *               alternateNumber: { type: string }
 *               emergencyContactNumber: { type: string }
 *               homeContactNumber: { type: string }
 *               propertyId: { type: string }
 *               roomId: { type: string }
 *               bedId: { type: string }
 *               inventoryAllocationId: { type: string }
 *               rentAmount: { type: number }
 *               depositAmount: { type: number }
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Allocation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     tenant: { $ref: '#/components/schemas/Tenant' }
 *                     allocation: { $ref: '#/components/schemas/TenantAllocation' }
 *                     inventoryAllocation: { $ref: '#/components/schemas/PropertyInventoryAllocation' }
 */
router.post('/create-complete-allocation', authorizePermissions('allocations:write'), TenantAllocationController.createCompleteAllocation);

/**
 * @swagger
 * /api/tenant-allocations/get-vacant-inventory:
 *   get:
 *     summary: Get all vacant rooms and beds for a specific property (Grouped by Room)
 *     tags: [TenantAllocations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of vacant inventory grouped by room
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   roomId: { type: string }
 *                   room: { $ref: '#/components/schemas/Room' }
 *                   floor: { $ref: '#/components/schemas/Floor' }
 *                   property: { $ref: '#/components/schemas/Property' }
 *                   vacantBeds:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/PropertyInventoryAllocation'
 */
router.get('/get-vacant-inventory', authorizePermissions('allocations:read'), TenantAllocationController.getVacantInventory);

/**
 * @swagger
 * /api/tenant-allocations/get-allocations:
 *   get:
 *     summary: Get all tenant allocations
 *     tags: [TenantAllocations]
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
 *                 $ref: '#/components/schemas/TenantAllocation'
 */
router.get('/get-allocations', authorizePermissions('allocations:read'), TenantAllocationController.getAll);

/**
 * @swagger
 * /api/tenant-allocations/get-tenant-by-property:
 *   get:
 *     summary: Get all tenant allocations for a specific property
 *     tags: [TenantAllocations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of tenant allocations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TenantAllocation'
 */
router.get('/get-tenant-by-property', authorizePermissions('allocations:read'), TenantAllocationController.getTenantByPropertyId);

/**
 * @swagger
 * /api/tenant-allocations/get-allocation:
 *   get:
 *     summary: Get allocation details by ID
 *     tags: [TenantAllocations]
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
 *               $ref: '#/components/schemas/TenantAllocation'
 */
router.get('/get-allocation', authorizePermissions('allocations:read'), TenantAllocationController.getAllocationById);

/**
 * @swagger
 * /api/tenant-allocations/update-allocation:
 *   put:
 *     summary: Update allocation details
 *     tags: [TenantAllocations]
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
 *               id: { type: string }
 *               rentAmount: { type: number }
 *               depositAmount: { type: number }
 *               status:
 *                 type: string
 *                 enum: ["active","inactive","terminated"]
 *               endDate: { type: string, format: date }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Allocation updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TenantAllocation'
 */
router.put('/update-allocation', authorizePermissions('allocations:write'), TenantAllocationController.update);

/**
 * @swagger
 * /api/tenant-allocations/delete-allocation:
 *   delete:
 *     summary: Delete an allocation
 *     tags: [TenantAllocations]
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
 *         description: Allocation deleted
 */
router.delete('/delete-allocation', authorizePermissions('allocations:delete'), TenantAllocationController.delete);

/**
 * @swagger
 * /api/tenant-allocations/initiate-exit:
 *   post:
 *     summary: Initiate move out for a tenant (Sets exit date)
 *     tags: [TenantAllocations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [allocationId, exitDate]
 *             properties:
 *               allocationId: { type: string }
 *               exitDate: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Exit initiated successfully
 */
router.post('/initiate-exit', authorizePermissions('allocations:write'), TenantAllocationController.initiateExit);

export default router;
