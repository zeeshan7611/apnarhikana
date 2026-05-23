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
 *                 enum: ["active","inactive","terminated","notice"]
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

/**
 * @swagger
 * /api/tenant-allocations/move-out-list:
 *   get:
 *     summary: Get all move-out requests (Landlord)
 *     description: Returns paginated list of tenants who have initiated move-out, filterable by status and property.
 *     tags: [TenantAllocations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: propertyId
 *         schema: { type: string }
 *         description: Filter by property
 *       - in: query
 *         name: moveOutStatus
 *         schema:
 *           type: string
 *           enum: ["pending","approved","revoked"]
 *         description: Filter by move-out request status
 *     responses:
 *       200:
 *         description: Paginated list of move-out requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string }
 *                       tenantId: { type: object }
 *                       propertyId: { type: object }
 *                       exitInitiatedAt: { type: string, format: date-time }
 *                       endDate: { type: string, format: date-time }
 *                       moveOutStatus:
 *                         type: string
 *                         enum: ["pending","approved","revoked"]
 *                       moveOutInitiatedBy:
 *                         type: string
 *                         enum: ["tenant","landlord"]
 *                       eligibleRefundPercentage: { type: number }
 *                       eligibleRefundAmount: { type: number }
 *                 total: { type: number }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 totalPages: { type: integer }
 */
router.get('/move-out-list', authorizePermissions('allocations:read'), TenantAllocationController.getMoveOutList);

/**
 * @swagger
 * /api/tenant-allocations/move-out-detail:
 *   get:
 *     summary: Get move-out request detail by allocation ID (Landlord)
 *     tags: [TenantAllocations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: TenantAllocation ID
 *     responses:
 *       200:
 *         description: Move-out request detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       404:
 *         description: Move-out request not found
 */
router.get('/move-out-detail', authorizePermissions('allocations:read'), TenantAllocationController.getMoveOutDetail);

/**
 * @swagger
 * /api/tenant-allocations/action-move-out:
 *   patch:
 *     summary: Approve or Revoke a tenant's move-out request (Landlord)
 *     description: Handles move-out actions in one endpoint. Use action "approve" to confirm the move-out or "revoke" to cancel it (with an optional reason).
 *     tags: [TenantAllocations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, action]
 *             properties:
 *               id:
 *                 type: string
 *                 description: TenantAllocation ID
 *               action:
 *                 type: string
 *                 enum: ["approve", "revoke"]
 *                 description: Action to perform on the move-out request
 *               reason:
 *                 type: string
 *                 description: Optional reason (used when action is "revoke")
 *     responses:
 *       200:
 *         description: Move-out action applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *       400:
 *         description: Missing or invalid action
 *       404:
 *         description: Allocation not found
 */
router.patch('/action-move-out', authorizePermissions('allocations:write'), TenantAllocationController.actionMoveOut);

export default router;
