import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { config } from './config.js'

import pagesRouter from './routes/pages.js'
import navigationRouter from './routes/navigation.js'
import footerRouter from './routes/footer.js'
import newsroomRouter from './routes/newsroom.js'
import pricingRouter from './routes/pricing.js'
import testimonialsRouter from './routes/testimonials.js'
import changelogRouter from './routes/changelog.js'
import { startSyncInterval } from './services/githubSync.js'
import jobsRouter from './routes/jobs.js'
import settingsRouter from './routes/settings.js'
import mcpTokensRouter from './routes/mcp-tokens.js'
import localesRouter from './routes/locales.js'
import translationsRouter from './routes/translations.js'
import sitemapRouter from './routes/sitemap.js'
import backupRouter from './routes/backup.js'
import uploadRouter from './routes/upload.js'
import { mountMcp } from './mcp.js'

const app = express()

app.use(cors({
  origin: config.corsOrigin ? config.corsOrigin.split(',') : true,
  credentials: true,
}))

// MCP must be mounted before express.json() — it needs raw body
mountMcp(app)

app.use(express.json({ limit: '5mb' }))

// API routes
app.use('/api/pages', pagesRouter)
app.use('/api/navigation', navigationRouter)
app.use('/api/footer', footerRouter)
app.use('/api/newsroom', newsroomRouter)
app.use('/api/pricing', pricingRouter)
app.use('/api/testimonials', testimonialsRouter)
app.use('/api/changelog', changelogRouter)
app.use('/api/jobs', jobsRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/mcp-tokens', mcpTokensRouter)
app.use('/api/locales', localesRouter)
app.use('/api/translations', translationsRouter)
app.use('/api/backup', backupRouter)
app.use('/api/upload', uploadRouter)

// Sitemap
app.use('/', sitemapRouter)

// Platform stats — proxy to Oxy API
app.get('/api/platform-stats', async (_req, res) => {
  try {
    const resp = await fetch(`${config.oxyApiBase}/platform-stats`)
    if (!resp.ok) throw new Error(`Oxy API returned ${resp.status}`)
    res.json(await resp.json())
  } catch (error) {
    console.error('Platform stats proxy error:', error)
    res.status(502).json({ error: 'Failed to fetch platform stats' })
  }
})

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }))

async function start() {
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')

  startSyncInterval()

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`)
  })
}

start().catch(console.error)
