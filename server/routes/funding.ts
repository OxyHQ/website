import { Router } from 'express'
import { config } from '../config.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const resp = await fetch(`${config.oxyApiBase}/funding-progress`)
    if (!resp.ok) throw new Error(`Oxy API returned ${resp.status}`)
    res.json(await resp.json())
  } catch {
    res.json({
      targetAmount: 2500000,
      raisedAmount: 0,
      currency: 'usd',
      sustainable: false,
      breakdown: { subscriptions: 0, donations: 0, partnerships: 0, services: 0 },
      supporters: 0,
      updatedAt: new Date().toISOString(),
    })
  }
})

export default router
