import { Router } from 'express';
import AgreementController from '../controllers/AgreementController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Agreement
 *   description: Agreement version and URL operations
 */

/**
 * @swagger
 * /api/agreement:
 *   get:
 *     summary: Get current agreement version and URL
 *     tags: [Agreement]
 *     responses:
 *       200:
 *         description: Agreement details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   description: Current agreement version
 *                   example: '1.0.0'
 *                 url:
 *                   type: string
 *                   description: URL to the agreement document
 *                   example: 'https://example.com/agreement/terms-and-conditions.pdf'
 */
router.get('/', AgreementController.getAgreement);

export default router;
