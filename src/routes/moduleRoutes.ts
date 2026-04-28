import { Router } from 'express';
import ModuleController from '../controllers/ModuleController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Modules
 *   description: Module management
 */

/**
 * @swagger
 * /api/modules/get-modules:
 *   get:
 *     summary: Get all modules
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of modules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Module'
 */
router.get('/get-modules', authorizePermissions('users:read'), ModuleController.getAllModules);

/**
 * @swagger
 * /api/modules/create-module:
 *   post:
 *     summary: Create a new module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, key]
 *             properties:
 *               name: { type: string }
 *               key: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Module created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
 */
router.post('/create-module', authorizePermissions('users:write'), ModuleController.createModule);

/**
 * @swagger
 * /api/modules/update-module:
 *   put:
 *     summary: Update module details
 *     tags: [Modules]
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
 *               name: { type: string }
 *               key: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Module updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
 */
router.put('/update-module', authorizePermissions('users:write'), ModuleController.updateModule);

/**
 * @swagger
 * /api/modules/delete-module:
 *   delete:
 *     summary: Delete a module
 *     tags: [Modules]
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
 *         description: Module deleted
 */
router.delete('/delete-module', authorizePermissions('users:write'), ModuleController.deleteModule);

export default router;
