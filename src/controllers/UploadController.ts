import { Request, Response } from 'express';
import { getPresignedUploadUrl } from '../services/R2Service';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
];

// ─── Presigned PUT URL (client uploads directly to R2) ──────────────────────
export const getPresignedUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, contentType, fileSize } = req.query as {
      filename?: string;
      contentType?: string;
      fileSize?: string;
    };

    // ── Validate required params ──────────────────────────────────────────────
    if (!filename || !contentType || !fileSize) {
      res.status(400).json({
        success: false,
        message: 'Query params `filename`, `contentType`, and `fileSize` are required',
      });
      return;
    }

    // ── Validate content type ─────────────────────────────────────────────────
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      res.status(400).json({
        success: false,
        message: `File type not allowed. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
      });
      return;
    }

    // ── Validate file size (max 20 MB) ────────────────────────────────────────
    const fileSizeBytes = parseInt(fileSize, 10);
    if (isNaN(fileSizeBytes) || fileSizeBytes <= 0) {
      res.status(400).json({
        success: false,
        message: '`fileSize` must be a positive number (in bytes)',
      });
      return;
    }
    if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      res.status(400).json({
        success: false,
        message: `File size exceeds the 20 MB limit. Received: ${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB`,
      });
      return;
    }

    const result = await getPresignedUploadUrl(filename, contentType, 'uploads', 300);

    res.status(200).json({
      success: true,
      uploadUrl: result.uploadUrl,
      publicUrl: result.publicUrl,
      key: result.key,
      expiresIn: result.expiresIn,
    });
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate presigned URL',
      error: error.message,
    });
  }
};
