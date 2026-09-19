import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { buildSitemapXml } from './sitemap'

describe('sitemap presentation', () => {
  test('associates the generated sitemap with its human-readable stylesheet', () => {
    const xml = buildSitemapXml(
      [
        { path: '/', changefreq: 'weekly', priority: 1 },
        { path: '/pricing', changefreq: 'monthly', priority: 0.9 },
      ],
      { siteUrl: 'https://oxy.so', defaultLocale: 'en', localeCodes: ['es'] },
    )

    expect(xml).toStartWith('<?xml version="1.0" encoding="UTF-8"?>\n')
    expect(xml).toContain('<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>')
    expect(xml).toContain('<loc>https://oxy.so/</loc>')
    expect(xml).toContain('<loc>https://oxy.so/pricing/</loc>')
    expect(xml).toContain('hreflang="es" href="https://oxy.so/es/pricing/"')
    expect(xml).not.toContain('href="https://oxy.so/pricing"')
  })

  test('ships an XSLT 1.0 view that understands the sitemap namespace', async () => {
    const stylesheet = await readFile(new URL('../public/sitemap.xsl', import.meta.url), 'utf8')

    expect(stylesheet).toContain('version="1.0"')
    expect(stylesheet).toContain('xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect(stylesheet).toContain('select="sitemap:urlset/sitemap:url"')
  })
})
