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
import jobsRouter from './routes/jobs.js'
import settingsRouter from './routes/settings.js'
import mcpTokensRouter from './routes/mcp-tokens.js'

const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: true }))
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

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }))

async function start() {
  await mongoose.connect(config.mongoUri)
  console.log('Connected to MongoDB')

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`)
  })
}

start().catch(console.error)
