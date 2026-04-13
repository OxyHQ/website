import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { uploadToSpaces } from '../services/s3.js'
import { processImage } from '../services/thumbnails.js'
import { Media } from '../models/Media.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.post('/', requireAuth, adminOnly, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })

  const folder = typeof req.body.folder === 'string' ? `oxy-website/${req.body.folder}` : 'oxy-website/images'

  try {
    // Step 1: Upload original to S3 (must succeed)
    const url = await uploadToSpaces(req.file.buffer, req.file.originalname, req.file.mimetype, folder)
    const key = new URL(url).pathname.slice(1)

    // Step 2: Generate thumbnails (optional — graceful failure)
    let width: number | undefined
    let height: number | undefined
    let thumbnails = { sm: '', md: '', lg: '' }
    try {
      const result = await processImage(req.file.buffer, req.file.originalname, req.file.mimetype, folder)
      width = result.width
      height = result.height
      thumbnails = result.thumbnails
    } catch (e) {
      console.warn('Thumbnail generation failed, continuing without thumbnails:', e)
    }

    // Step 3: Create Media document (must succeed)
    const media = await Media.create({
      url, thumbnails, filename: req.file.originalname, key,
      mimeType: req.file.mimetype, size: req.file.size,
      width, height, alt: '', tags: [],
      folder: req.body.folder || 'images',
      uploadedBy: (req as any).userId || '',
    })

    res.json(media)
  } catch (err: any) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message || 'Upload failed' })
  }
})

export default router
