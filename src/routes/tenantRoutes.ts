import { Router } from 'express';
import TenantController from '../controllers/TenantController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management operations
 */

/**
 * @swagger
 * /api/tenants/create-tenant:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phoneNumber, email, joiningDate, emergencyContactNumber]
 *             properties:
 *               fullName: { type: string }
 *               phoneNumber: { type: string }
 *               email: { type: string }
 *               joiningDate: { type: string, format: date-time }
 *               alternateNumber: { type: string }
 *               emergencyContactNumber: { type: string }
 *               homeContactNumber: { type: string }
 *               createdById: { type: string }
 *     responses:
 *       201:
 *         description: Tenant created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 */
router.post('/create-tenant', authorizePermissions('tenants:write'), TenantController.create);

/**
 * @swagger
 * /api/tenants/get-tenants:
 *   get:
 *     summary: Get all tenants
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tenants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tenant'
 */
router.get('/get-tenants', authorizePermissions('tenants:read'), TenantController.getAll);

/**
 * @swagger
 * /api/tenants/get-tenant:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Tenants]
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
 *         description: Tenant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 */
router.get('/get-tenant', authorizePermissions('tenants:read'), TenantController.getById);

/**
 * @swagger
 * /api/tenants/update-tenant:
 *   put:
 *     summary: Update tenant details
 *     tags: [Tenants]
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
 *               fullName: { type: string }
 *               phoneNumber: { type: string }
 *               email: { type: string }
 *               joiningDate: { type: string, format: date-time }
 *               alternateNumber: { type: string }
 *               emergencyContactNumber: { type: string }
 *               homeContactNumber: { type: string }
 *     responses:
 *       200:
 *         description: Tenant updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tenant'
 */
router.put('/update-tenant', authorizePermissions('tenants:write'), TenantController.update);


/**
 * @swagger
 * /api/tenants/delete-tenant:
 *   delete:
 *     summary: Delete a tenant
 *     tags: [Tenants]
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
 *         description: Tenant deleted
 */
router.delete('/delete-tenant', authorizePermissions('tenants:delete'), TenantController.delete);

/**
 * @swagger
 * /api/tenants/kyc-details:
 *   post:
 *     summary: Get KYC details for one or multiple properties
 *     description: Retrieves KYC document information and approval status for tenants. If propertyId is omitted, returns KYC details across all properties. Can filter by KYC status.
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyId:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *                 description: Optional property ID or array of property IDs to filter KYC details
 *               status:
 *                 type: string
 *                 enum: ["pending", "uploaded", "approved", "rejected"]
 *                 description: Optional status to filter KYC details
 *             example:
 *               propertyId: ['propertyId1', 'propertyId2']
 *               status: 'uploaded'
 *     responses:
 *       200:
 *         description: Array of KYC details
 *       400:
 *         description: Invalid request payload
 */
router.post('/kyc-details', authorizePermissions('tenants:read'), TenantController.getKYCDetails);

/**
 * @swagger
 * /api/tenants/approve-or-reject-kyc:
 *   post:
 *     summary: Approve or reject tenant KYC
 *     description: Updates the KYC status to approved or rejected. For rejection, optionally provide a rejection reason.
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId, action]
 *             properties:
 *               tenantId: { type: string, description: "ID of the tenant" }
 *               action: { type: string, enum: ["approve", "reject"], description: "Action to perform" }
 *               rejectionReason: { type: string, description: "Reason for rejection (only for reject action)" }
 *     responses:
 *       200:
 *         description: KYC status updated successfully
 *       400:
 *         description: Invalid action or missing required fields
 *       404:
 *         description: Tenant not found
 */
router.post('/approve-or-reject-kyc', authorizePermissions('tenants:write'), TenantController.approveOrRejectKYC);

/**
 * @swagger
 * /api/tenants/get-tenant-kyc:
 *   get:
 *     summary: Fetch minimal tenant profile and full KYC details by tenantId
 *     description: Retrieves the tenant's full name, phone number, email, and detailed KYC documents/status by their tenant ID.
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the tenant
 *     responses:
 *       200:
 *         description: Minimal tenant details and full KYC documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     fullName: { type: string }
 *                     phoneNumber: { type: string }
 *                     email: { type: string }
 *                     kyc: { type: object }
 *       400:
 *         description: Missing required tenantId parameter
 *       404:
 *         description: Tenant not found
 */
router.get('/get-tenant-kyc', authorizePermissions('tenants:read'), TenantController.getTenantKYC);

export default router;
