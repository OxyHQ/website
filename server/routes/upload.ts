import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { ingestUpload } from '../services/media.js';
import { DOMAIN_ERROR_HTTP_STATUS, DomainError } from '../utils/domainError.js';
import { validate } from '../utils/validate.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const uploadBodySchema = z
  .object({
    folder: z.string().optional(),
  })
  .passthrough();

/**
 * An editor's upload into the media library. Images and videos become files of
 * the Oxy Website application in Oxy Files (`services/media.ts`); the editor is
 * recorded on the row as `uploadedBy`.
 */
router.post('/', requireAuth, adminOnly, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const { folder } = validate(uploadBodySchema, req.body);
  try {
    const result = await ingestUpload({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      declaredType: req.file.mimetype,
      folder: folder || 'images',
      uploadedBy: req.user?.id || '',
    });
    res.json(result.media);
  } catch (err: unknown) {
    if (err instanceof DomainError)
      return res.status(DOMAIN_ERROR_HTTP_STATUS[err.kind]).json({ error: err.message });
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
