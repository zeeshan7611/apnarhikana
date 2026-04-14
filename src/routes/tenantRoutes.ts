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
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               joiningDate:
 *                 type: string
 *                 format: date
 *               alternateNumber:
 *                 type: string
 *               emergencyContactNumber:
 *                 type: string
 *               homeContactNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tenant created
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
 *               id:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               alternateNumber:
 *                 type: string
 *               emergencyContactNumber:
 *                 type: string
 *               homeContactNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant updated
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

export default router;
