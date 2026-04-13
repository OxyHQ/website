import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { uploadToSpaces } from '../services/s3.js'
import { processImage } from '../services/thumbnails.js'
import { Media } from '../models/Media.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/**
 * POST /api/upload
 * Upload a file to DigitalOcean Spaces, create a Media document,
 * and return the full media object with thumbnails.
 * Requires admin authentication.
 */
router.post('/', requireAuth, adminOnly, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })

  const folder = typeof req.body.folder === 'string' ? `oxy-website/${req.body.folder}` : 'oxy-website/images'

  // Upload original to S3
  const url = await uploadToSpaces(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    folder,
  )

  // Extract S3 key from URL
  const key = new URL(url).pathname.slice(1)

  // Process image (detect dimensions + generate thumbnails)
  const { width, height, thumbnails } = await processImage(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    folder,
  )

  // Create Media document
  const media = await Media.create({
    url,
    thumbnails,
    filename: req.file.originalname,
    key,
    mimeType: req.file.mimetype,
    size: req.file.size,
    width,
    height,
    alt: '',
    tags: [],
    folder: req.body.folder || 'images',
    uploadedBy: (req as any).userId || '',
  })

  res.json(media)
})

export default router
