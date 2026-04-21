import { Router } from 'express';
import FeatureController from '../controllers/FeatureController';
import { authorizePermissions } from '../middleware/jwtAuth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Features
 *   description: Feature management
 */

/**
 * @swagger
 * /api/features/get-features:
 *   get:
 *     summary: Get all features
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of features
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feature'
 */
router.get('/get-features', authorizePermissions('users:read'), FeatureController.getAllFeatures);

/**
 * @swagger
 * /api/features/create-feature:
 *   post:
 *     summary: Create a new feature
 *     tags: [Features]
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
 *         description: Feature created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feature'
 */
router.post('/create-feature', authorizePermissions('users:write'), FeatureController.createFeature);

/**
 * @swagger
 * /api/features/update-feature:
 *   put:
 *     summary: Update feature details
 *     tags: [Features]
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
 *         description: Feature updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feature'
 */
router.put('/update-feature', authorizePermissions('users:write'), FeatureController.updateFeature);

/**
 * @swagger
 * /api/features/delete-feature:
 *   delete:
 *     summary: Delete a feature
 *     tags: [Features]
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
 *         description: Feature deleted
 */
router.delete('/delete-feature', authorizePermissions('users:write'), FeatureController.deleteFeature);

export default router;
