import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { fileUpload } from '../middleware/upload';
import { uploadBufferToR2, getFileFromR2 } from '../lib/r2';
import { successResponse, errorResponse } from '../utils/response';

const router = Router();

// POST /api/upload/file - Upload a file to R2
router.post(
  '/file',
  authMiddleware,
  fileUpload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      if (!req.file) {
        return errorResponse(res, 'No file provided', 400, 'MISSING_FILE');
      }

      // Upload to R2
      let uploadResult;
      try {
        uploadResult = await uploadBufferToR2(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'savra-ai/files'
        );
      } catch (uploadError) {
        console.error('R2 upload error:', uploadError);
        return errorResponse(
          res,
          'Failed to upload file. Please check R2 configuration.',
          500,
          'UPLOAD_FAILED'
        );
      }

      // Store file record in database
      const file = await prisma.file.create({
        data: {
          uploadedBy: userId,
          filename: req.file.originalname,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          fileUrl: uploadResult.url,
          publicId: uploadResult.key, // Using key as publicId for R2
        },
      });

      return successResponse(res, {
        id: file.id,
        url: file.fileUrl,
        key: file.publicId,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/upload/file/* - Proxy endpoint to serve files from R2
// This allows serving files even if the bucket is not public
// Must be after POST route to avoid conflicts
router.get('/file/*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract the key from the path (everything after /file/)
    // Express wildcard routes store the match in req.params[0]
    const key = (req.params as any)[0] || req.path.replace('/upload/file/', '');

    if (!key) {
      return errorResponse(res, 'No file key provided', 400, 'MISSING_KEY');
    }

    try {
      const file = await getFileFromR2(key);
      
      // Set appropriate headers
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
      
      // Send the file
      res.send(file.body);
    } catch (fetchError) {
      console.error('R2 file fetch error:', fetchError);
      return errorResponse(res, 'File not found', 404, 'FILE_NOT_FOUND');
    }
  } catch (error) {
    next(error);
  }
});

export default router;
