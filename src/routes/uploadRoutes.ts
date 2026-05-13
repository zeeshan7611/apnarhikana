import { Router } from 'express';
import { getPresignedUrl } from '../controllers/UploadController';

const router = Router();

/**
 * @openapi
 * /api/upload/presigned-url:
 *   get:
 *     summary: Get a presigned PUT URL for direct client-to-R2 upload
 *     description: |
 *       Returns a short-lived presigned PUT URL (5 min) that the client can use
 *       to upload a file directly to Cloudflare R2 — bypassing the server.
 *       After the PUT succeeds, use the returned `publicUrl` to reference the file.
 *       Max file size: 20 MB. Allowed types: image/jpeg, image/png, image/webp,
 *       image/gif, image/svg+xml, application/pdf.
 *     tags:
 *       - Upload
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         example: profile.jpg
 *         description: Original file name (used to preserve the file extension)
 *       - in: query
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "application/pdf"]
 *         example: image/jpeg
 *         description: MIME type of the file
 *       - in: query
 *         name: fileSize
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2048000
 *         description: File size in bytes (max 20971520 = 20 MB)
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:   { type: boolean, example: true }
 *                 uploadUrl: { type: string, description: 'Presigned PUT URL – valid for expiresIn seconds' }
 *                 publicUrl: { type: string, description: 'Permanent public URL of the file once uploaded' }
 *                 key:       { type: string, description: 'R2 object key' }
 *                 expiresIn: { type: number, example: 300 }
 *       400:
 *         description: Missing/invalid params, unsupported file type, or file exceeds 20 MB
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/presigned-url', getPresignedUrl);

export default router;
