import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { adminOnly } from '../middleware/adminOnly.js'
import { uploadToSpaces } from '../services/s3.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/**
 * POST /api/upload
 * Upload a file to DigitalOcean Spaces. Returns the public CDN URL.
 * Requires admin authentication.
 */
router.post('/', requireAuth, adminOnly, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })

  const folder = typeof req.body.folder === 'string' ? `oxy-website/${req.body.folder}` : 'oxy-website/images'

  const url = await uploadToSpaces(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    folder,
  )
  res.json({ url })
})

export default router
