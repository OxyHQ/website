import { Router } from 'express'
import { NewsroomPost } from '../models/NewsroomPost.js'
import { Job } from '../models/Job.js'
import { ChangelogEntry } from '../models/ChangelogEntry.js'

const router = Router()

const SITE_URL = 'https://oxy.so'

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq: string
  priority: number
}

const STATIC_ROUTES: SitemapEntry[] = [
  { loc: '/', changefreq: 'weekly', priority: 1.0 },
  { loc: '/pricing', changefreq: 'monthly', priority: 0.9 },
  { loc: '/codea', changefreq: 'monthly', priority: 0.9 },
  { loc: '/codea/extension', changefreq: 'monthly', priority: 0.8 },
  { loc: '/os', changefreq: 'monthly', priority: 0.8 },
  { loc: '/newsroom', changefreq: 'daily', priority: 0.8 },
  { loc: '/company/careers', changefreq: 'weekly', priority: 0.7 },
  { loc: '/company/news', changefreq: 'weekly', priority: 0.7 },
  { loc: '/changelog', changefreq: 'weekly', priority: 0.7 },
  { loc: '/developers/docs', changefreq: 'monthly', priority: 0.7 },
  { loc: '/developers/docs/overview', changefreq: 'monthly', priority: 0.7 },
  { loc: '/partners', changefreq: 'monthly', priority: 0.6 },
  { loc: '/help', changefreq: 'monthly', priority: 0.6 },
]

function toW3CDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildEntry(entry: SitemapEntry): string {
  return `  <url>
    <loc>${escapeXml(SITE_URL + entry.loc)}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`
}

router.get('/sitemap.xml', async (_req, res) => {
  try {
    const [posts, jobs, changelog] = await Promise.all([
      NewsroomPost.find({ status: 'published' }).select('slug updatedAt publishedAt').lean(),
      Job.find({ active: true }).select('slug updatedAt').lean(),
      ChangelogEntry.find().select('date updatedAt').sort('-date').limit(1).lean(),
    ])

    const entries: SitemapEntry[] = [...STATIC_ROUTES]

    // Add the latest changelog date as lastmod for the changelog page
    if (changelog.length > 0) {
      const changelogEntry = entries.find(e => e.loc === '/changelog')
      if (changelogEntry) {
        changelogEntry.lastmod = toW3CDate(new Date(changelog[0].date))
      }
    }

    // Newsroom posts
    for (const post of posts) {
      entries.push({
        loc: `/newsroom/${post.slug}`,
        lastmod: toW3CDate(new Date(post.updatedAt || post.publishedAt)),
        changefreq: 'monthly',
        priority: 0.7,
      })
    }

    // Job listings
    for (const job of jobs) {
      entries.push({
        loc: `/company/careers/${job.slug}`,
        lastmod: job.updatedAt ? toW3CDate(new Date(job.updatedAt)) : undefined,
        changefreq: 'monthly',
        priority: 0.6,
      })
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(buildEntry).join('\n')}
</urlset>`

    res.set('Content-Type', 'application/xml')
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
    res.send(xml)
  } catch (err) {
    console.error('Sitemap generation error:', err)
    res.status(500).send('Error generating sitemap')
  }
})

export default router
