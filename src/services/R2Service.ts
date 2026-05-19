import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});


// ─── Presigned PUT URL (client uploads directly to R2) ──────────────────────
export interface PresignedUploadResult {
  /** PUT this URL directly from the client with the file as the raw body */
  uploadUrl: string;
  /** Stable public URL to read the file after the upload completes */
  publicUrl: string;
  /** R2 object key – store this if you need to reference/delete the file later */
  key: string;
  /** Seconds until the uploadUrl expires (default 300 s) */
  expiresIn: number;
}

export const getPresignedUploadUrl = async (
  originalName: string,
  mimeType: string,
  _folder: string = 'uploads', // kept for API compatibility, ignored – base URL already includes /uploads
  expiresIn: number = 300
): Promise<PresignedUploadResult> => {
  // Store under uploads/ folder in R2 → https://apnathikana.in/uploads/{timestamp}-{filename}
  const sanitized = path.basename(originalName).replace(/\s+/g, '-');
  const key = `uploads/${Date.now()}-${sanitized}`;

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!.trim(),
    Key: key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });

  const baseUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, '');
  const publicUrl = `${baseUrl}/${key}`;

  return { uploadUrl, publicUrl, key, expiresIn };
};

/**
 * Delete a file from R2 bucket by key
 */
export const deleteFile = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!.trim(),
      Key: key,
    });
    await r2Client.send(command);
  } catch (err) {
    console.error(`Failed to delete file with key: ${key}`, err);
  }
};

/**
 * Extract key from public URL and delete from R2
 */
export const deleteFileFromUrl = async (url: string): Promise<void> => {
  try {
    if (!url) return;
    const parsed = new URL(url);
    // Remove the leading slash if present
    const key = parsed.pathname.startsWith('/') ? parsed.pathname.substring(1) : parsed.pathname;
    await deleteFile(key);
  } catch (err) {
    console.error(`Failed to delete file from URL: ${url}`, err);
  }
};

