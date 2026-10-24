import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for R2 compatibility
});

const BUCKET_NAME = process.env.R2_BUCKET || 'brillinity-management-system';

// Generate public URL for R2 object
const getPublicUrl = (key: string): string => {
  // Use proxy endpoint by default since R2 buckets may not be public
  // Set R2_USE_DIRECT_URL=true to use direct R2 URLs (requires public bucket)
  const useDirectUrl = process.env.R2_USE_DIRECT_URL === 'true';
  
  if (useDirectUrl) {
    // Use direct R2 public URL (requires bucket to be public in Cloudflare dashboard)
    const endpoint = process.env.R2_ENDPOINT || '';
    const accountId = endpoint.match(/([a-f0-9]+)\.r2\.cloudflarestorage\.com/)?.[1] || '';
    return `https://pub-${accountId}.r2.dev/${key}`;
  }
  
  // Use backend proxy endpoint (works even if bucket is not public)
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return `${apiUrl}/upload/file/${key}`;
};

// Upload buffer to R2
export const uploadBufferToR2 = async (
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads'
): Promise<{ url: string; key: string }> => {
  // Generate unique filename
  const extension = originalName.split('.').pop() || '';
  const uniqueFilename = `${uuidv4()}.${extension}`;
  const key = `${folder}/${uniqueFilename}`;

  // Upload to R2
  // Note: R2 doesn't support ACL. For public access, configure the bucket as public in Cloudflare dashboard
  // or use a proxy endpoint to serve files
  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  // Generate public URL
  // Note: For R2, you may need to set up a custom domain or use presigned URLs
  // Using the R2.dev subdomain format for public access
  const url = getPublicUrl(key);

  return { url, key };
};

// Get file from R2 (for proxy endpoint)
export const getFileFromR2 = async (key: string): Promise<{ body: Buffer; contentType: string }> => {
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error('File not found in R2');
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  return {
    body: buffer,
    contentType: response.ContentType || 'application/octet-stream',
  };
};

// Delete file from R2
export const deleteFromR2 = async (key: string): Promise<void> => {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
};

export default r2Client;
