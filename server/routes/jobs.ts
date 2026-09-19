import { Router } from 'express'
import { z } from 'zod'
import { getCareerJob, listCareerJobs } from '../services/careers.js'
import { validate } from '../utils/validate.js'

/**
 * Oxy's open roles, read from Clarity Jobs. Read-only by construction: an
 * opening is written, edited and closed in Mention, never here.
 */
const router = Router()

const idParamsSchema = z.object({ id: z.string().trim().min(1).max(128) })

const UNAVAILABLE = { error: 'Open roles are temporarily unavailable' }

router.get('/', async (_req, res) => {
  try {
    res.json(await listCareerJobs())
  } catch (error) {
    console.error('[careers] Clarity job search failed:', error)
    res.status(502).json(UNAVAILABLE)
  }
})

router.get('/:id', async (req, res) => {
  const { id } = validate(idParamsSchema, req.params)
  try {
    const job = await getCareerJob(id)
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
  } catch (error) {
    console.error('[careers] Clarity job lookup failed:', error)
    res.status(502).json(UNAVAILABLE)
  }
})

export default router
