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
import likesRouter from './routes/likes.js'
import commentsRouter from './routes/comments.js'
import featuresRouter from './routes/features.js'
import profilesRouter from './routes/profiles.js'
import badgesRouter from './routes/badges.js'
import teamRouter from './routes/team.js'
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
app.use('/api/team', teamRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/mcp-tokens', mcpTokensRouter)
app.use('/api/locales', localesRouter)
app.use('/api/translations', translationsRouter)
app.use('/api/backup', backupRouter)
app.use('/api/upload', uploadRouter)

// Social features
app.use('/api/likes', likesRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/features', featuresRouter)
app.use('/api/profiles', profilesRouter)
app.use('/api/badges', badgesRouter)

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

// Infrastructure status — polls DigitalOcean API for droplet/app/db health
interface InfraStatusNode {
  region: string
  status: 'online' | 'degraded' | 'offline'
  droplets: number
  apps: number
  dbs: number
}
let infraCache: { nodes: InfraStatusNode[]; fetchedAt: number } | null = null
const INFRA_CACHE_TTL = 60_000

async function fetchInfraStatus(): Promise<InfraStatusNode[]> {
  if (infraCache && Date.now() - infraCache.fetchedAt < INFRA_CACHE_TTL) {
    return infraCache.nodes
  }

  const token = config.doApiToken
  if (!token) {
    // No DO token — return static healthy status for known regions
    return [
      { region: 'ams3', status: 'online', droplets: 5, apps: 8, dbs: 5 },
      { region: 'lon1', status: 'online', droplets: 1, apps: 1, dbs: 0 },
      { region: 'nyc1', status: 'online', droplets: 1, apps: 1, dbs: 0 },
    ]
  }

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const regionMap = new Map<string, InfraStatusNode>()

  const ensure = (region: string): InfraStatusNode => {
    if (!regionMap.has(region)) {
      regionMap.set(region, { region, status: 'online', droplets: 0, apps: 0, dbs: 0 })
    }
    return regionMap.get(region)!
  }

  try {
    const [dropletsRes, appsRes, dbsRes] = await Promise.allSettled([
      fetch('https://api.digitalocean.com/v2/droplets?per_page=100', { headers }),
      fetch('https://api.digitalocean.com/v2/apps?per_page=100', { headers }),
      fetch('https://api.digitalocean.com/v2/databases?per_page=100', { headers }),
    ])

    if (dropletsRes.status === 'fulfilled' && dropletsRes.value.ok) {
      const data = await dropletsRes.value.json()
      for (const d of data.droplets || []) {
        const node = ensure(d.region?.slug || 'ams3')
        node.droplets++
        if (d.status !== 'active') node.status = 'degraded'
      }
    }

    if (appsRes.status === 'fulfilled' && appsRes.value.ok) {
      const data = await appsRes.value.json()
      for (const a of data.apps || []) {
        const region = a.region?.slug || a.default_ingress?.split('.')[0] || 'ams'
        const node = ensure(region.replace(/\d+$/, '') === 'ams' ? 'ams3' : region)
        node.apps++
      }
    }

    if (dbsRes.status === 'fulfilled' && dbsRes.value.ok) {
      const data = await dbsRes.value.json()
      for (const db of data.databases || []) {
        const node = ensure(db.region || 'ams3')
        node.dbs++
        if (db.status !== 'online') node.status = 'degraded'
      }
    }

    // Ensure our 3 known regions always appear
    ensure('ams3')
    ensure('lon1')
    ensure('nyc1')
  } catch (error) {
    console.error('Infra status fetch error:', error)
    return [
      { region: 'ams3', status: 'online', droplets: 0, apps: 0, dbs: 0 },
      { region: 'lon1', status: 'online', droplets: 0, apps: 0, dbs: 0 },
      { region: 'nyc1', status: 'online', droplets: 0, apps: 0, dbs: 0 },
    ]
  }

  const nodes = Array.from(regionMap.values())
  infraCache = { nodes, fetchedAt: Date.now() }
  return nodes
}

app.get('/api/infra-status', async (_req, res) => {
  try {
    const nodes = await fetchInfraStatus()
    res.json({ nodes })
  } catch (error) {
    console.error('Infra status error:', error)
    res.status(500).json({ error: 'Failed to fetch infrastructure status' })
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
