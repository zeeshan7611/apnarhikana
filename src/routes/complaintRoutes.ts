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
 *               tenantId: { type: string }
 *               propertyId: { type: string }
 *               category: { type: string }
 *               priority:
 *                 type: string
 *                 enum: ["low","medium","high","urgent"]
 *               title: { type: string }
 *               description: { type: string }
 *               sourceApp:
 *                 type: string
 *                 enum: ["tenant","propertyManager"]
 *               assignedTo: { type: string }
 *               resolutionNotes: { type: string }
 *     responses:
 *       201:
 *         description: Complaint created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Complaint'
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
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: priority
 *         schema: { type: string }
 *       - in: query
 *         name: tenantId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Complaint'
 */
router.get('/get-complaints', authorizePermissions('complaints:read'), ComplaintController.getAll);

/**
 * @swagger
 * /api/complaints/get-recent-complaints:
 *   get:
 *     summary: Get the 4 most recent complaints
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Complaint'
 */
router.get('/get-recent-complaints', authorizePermissions('complaints:read'), ComplaintController.getRecent);

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
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Complaint details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Complaint'
 *       404:
 *         description: Complaint not found
 */
router.get('/get-complaint', authorizePermissions('complaints:read'), ComplaintController.getById);

/**
 * @swagger
 * /api/complaints/update-complaint:
 *   put:
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
 *               id: { type: string }
 *               status:
 *                 type: string
 *                 enum: ["open","in-progress","resolved","closed"]
 *               priority:
 *                 type: string
 *                 enum: ["low","medium","high","urgent"]
 *               category: { type: string }
 *               title: { type: string }
 *               description: { type: string }
 *               assignedTo: { type: string }
 *               resolutionNotes: { type: string }
 *     responses:
 *       200:
 *         description: Complaint updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Complaint'
 */
router.put('/update-complaint', authorizePermissions('complaints:write'), ComplaintController.update);

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

/**
 * @swagger
 * /api/complaints/get-open-complaints-count:
 *   get:
 *     summary: Get total count of open and in-progress complaints
 *     tags: [Complaints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         required: false
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Total open complaints count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOpen: { type: number }
 */
router.get('/get-open-complaints-count', authorizePermissions('complaints:read'), ComplaintController.getOpenCount);

export default router;
