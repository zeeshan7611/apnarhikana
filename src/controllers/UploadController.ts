import { Request, Response } from 'express';
import { getPresignedUploadUrl } from '../services/R2Service';

// ─── Presigned PUT URL (client uploads directly to R2) ──────────────────────
export const getPresignedUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, contentType } = req.query as {
      filename?: string;
      contentType?: string;
    };

    if (!filename || !contentType) {
      res.status(400).json({
        success: false,
        message: 'Query params `filename` and `contentType` are required',
      });
      return;
    }

    // Allow only image content types
    if (!contentType.startsWith('image/')) {
      res.status(400).json({
        success: false,
        message: 'Only image/* content types are allowed',
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
