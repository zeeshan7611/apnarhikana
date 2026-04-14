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
 *     summary: Allocate a room/bed to a tenant
 *     tags: [TenantAllocations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId, inventoryAllocationId, rentAmount, depositAmount, startDate]
 *             properties:
 *               tenantId:
 *                 type: string
 *               inventoryAllocationId:
 *                 type: string
 *               rentAmount:
 *                 type: number
 *               depositAmount:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Allocation created
 */
router.post('/create-allocation', authorizePermissions('allocations:write'), TenantAllocationController.create);

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
 */
router.get('/get-allocations', authorizePermissions('allocations:read'), TenantAllocationController.getAll);

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
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Allocation details
 */
router.get('/get-allocation', authorizePermissions('allocations:read'), TenantAllocationController.getById);

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
 *               id:
 *                 type: string
 *               rentAmount:
 *                 type: number
 *               depositAmount:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [active, inactive, terminated]
 *               endDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Allocation updated
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

export default router;
