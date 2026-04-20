import { Router } from 'express';
import ComplaintController from '../controllers/ComplaintController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Tenant complaint management operations
 */

/**
 * @swagger
 * /api/complaints/create-complaint:
 *   post:
 *     summary: Raise a new complaint
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId, category, title, description, sourceApp]
 *             properties:
 *               tenantId:
 *                 type: string
 *               propertyId:
 *                 type: string
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               sourceApp:
 *                 type: string
 *                 enum: [tenant, propertyManager]
 *     responses:
 *       201:
 *         description: Complaint created
 */
router.post('/create-complaint', authorizePermissions('complaints:write'), ComplaintController.create);

/**
 * @swagger
 * /api/complaints/get-complaints:
 *   get:
 *     summary: Get all complaints (with optional filters)
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: tenantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of complaints
 */
router.get('/get-complaints', authorizePermissions('complaints:read'), ComplaintController.getAll);

/**
 * @swagger
 * /api/complaints/get-complaint:
 *   get:
 *     summary: Get complaint details by ID
 *     tags: [Complaints]
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
 *         description: Complaint details
 */
router.get('/get-complaint', authorizePermissions('complaints:read'), ComplaintController.getById);

/**
 * @swagger
 * /api/complaints/update-complaint:
 *   patch:
 *     summary: Update complaint (status, resolution notes, etc)
 *     tags: [Complaints]
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
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, resolved, closed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               assignedTo:
 *                 type: string
 *               resolutionNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Complaint updated
 */
router.patch('/update-complaint', authorizePermissions('complaints:write'), ComplaintController.update);

/**
 * @swagger
 * /api/complaints/delete-complaint:
 *   delete:
 *     summary: Delete a complaint record
 *     tags: [Complaints]
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
 *         description: Complaint deleted
 */
router.delete('/delete-complaint', authorizePermissions('complaints:delete'), ComplaintController.delete);

export default router;
