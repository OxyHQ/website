import { describe, expect, test } from 'bun:test'
import { canonicalTo, canonicalHref } from '../src/lib/canonicalPath'
import { hasLocalizedVariants } from '../src/lib/localizedRoute'
import { buildRedirectsFile, SPA_FALLBACK_PATTERNS } from './redirects'
import { buildSitemapXml } from './sitemap'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../src/lib/i18n/types'
import { rewriteSiblingDocLinks } from './docs-links'

describe('internal links point at the canonical URL', () => {
  test('adds the trailing slash Cloudflare would 308 to', () => {
    expect(canonicalTo('/pricing')).toBe('/pricing/')
    expect(canonicalTo('/developers/docs/bloom/components')).toBe('/developers/docs/bloom/components/')
    expect(canonicalTo('/')).toBe('/')
  })

  test('keeps the slash outside the query and the fragment', () => {
    expect(canonicalTo('/company/careers#open-positions')).toBe('/company/careers/#open-positions')
    expect(canonicalTo('/apps?filter=ai')).toBe('/apps/?filter=ai')
  })

  test('leaves alone what Cloudflare serves verbatim or does not serve at all', () => {
    // A real file in public/ — a slash here is a 404, not a redirect.
    expect(canonicalTo('/llms.txt')).toBe('/llms.txt')
    expect(canonicalTo('/og-default.png')).toBe('/og-default.png')
    expect(canonicalTo('https://mention.earth/@oxy')).toBe('https://mention.earth/@oxy')
    // An absolute link to our own origin is an internal link written the long
    // way, and it 308s just the same.
    expect(canonicalTo('https://oxy.so/newsroom')).toBe('https://oxy.so/newsroom/')
    expect(canonicalTo('https://fairco.in/wallet')).toBe('https://fairco.in/wallet/')
    expect(canonicalTo('https://oxy.so/og-default.png')).toBe('https://oxy.so/og-default.png')
    // A dot in the last segment is not enough: typedoc names symbol pages this
    // way, and they are documents like any other.
    expect(canonicalTo('/developers/docs/bloom/1.0.0/api/functions/ColorEngine.argbFromHex')).toBe(
      '/developers/docs/bloom/1.0.0/api/functions/ColorEngine.argbFromHex/',
    )
    expect(canonicalTo('#faq')).toBe('#faq')
    expect(canonicalTo('../sibling')).toBe('../sibling')
  })

  test('normalises the object form react-router also accepts', () => {
    expect(canonicalTo({ pathname: '/help', hash: '#top' })).toEqual({ pathname: '/help/', hash: '#top' })
  })

  test('canonicalHref covers prose links rendered outside the router', () => {
    expect(canonicalHref('/academy/using-oxy-id/03-recovery')).toBe('/academy/using-oxy-id/03-recovery/')
    expect(canonicalHref(undefined)).toBeUndefined()
  })
})

describe('locale mirrors only where a translation exists', () => {
  test('marketing and content routes are mirrored', () => {
    expect(hasLocalizedVariants('/')).toBe(true)
    expect(hasLocalizedVariants('/pricing')).toBe(true)
    expect(hasLocalizedVariants('/help/auth/2fa-setup')).toBe(true)
  })

  test('synced developer documentation is not — it has no translated source', () => {
    expect(hasLocalizedVariants('/developers/docs')).toBe(false)
    expect(hasLocalizedVariants('/developers/docs/bloom/1.0.0/use-theme')).toBe(false)
    expect(hasLocalizedVariants('/developers/docs/')).toBe(false)
  })

  test('the prefix match is on a whole segment', () => {
    expect(hasLocalizedVariants('/developers')).toBe(true)
    expect(hasLocalizedVariants('/developers/docs-archive')).toBe(true)
  })

  test('the sitemap drops the alternates for a route with no mirror', () => {
    const xml = buildSitemapXml(
      [
        { path: '/pricing', changefreq: 'monthly', priority: 0.9 },
        { path: '/developers/docs/bloom/1.0.0', changefreq: 'monthly', priority: 0.5 },
      ],
      { siteUrl: 'https://oxy.so', defaultLocale: 'en', localeCodes: ['es'] },
    )
    expect(xml).toContain('hreflang="es" href="https://oxy.so/es/pricing/"')
    expect(xml).not.toContain('https://oxy.so/es/developers/docs/')
  })
})

describe('_redirects', () => {
  const contents = buildRedirectsFile({
    supportedLocales: ['en', 'es', 'ca', 'fr'],
    defaultLocale: 'en',
    mirroredLocales: ['es', 'ca'],
    localeReadinessKnown: true,
  })
  const rules = contents
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => line.trim().split(/\s+/))

  test('ends in a real 404, not a 200 copy of the home page', () => {
    expect(rules.at(-1)).toEqual(['/*', '/404.html', '404'])
    expect(contents).not.toContain('/index.html')
  })

  test('answers live-data and signed-in surfaces with the neutral shell', () => {
    for (const pattern of SPA_FALLBACK_PATTERNS) {
      expect(rules).toContainEqual([pattern, '/app-shell.html', '200'])
    }
    expect(rules).toContainEqual(['/es/newsroom/*', '/app-shell.html', '200'])
  })

  test('covers the trailing-slash form of every literal rule', () => {
    // Every link on the site now points at `/dashboard/`, and Cloudflare matches
    // a source literally — a rule written only as `/dashboard` would let a
    // reload fall through to the catch-all.
    expect(rules).toContainEqual(['/dashboard', '/app-shell.html', '200'])
    expect(rules).toContainEqual(['/dashboard/', '/app-shell.html', '200'])
    expect(rules).toContainEqual(['/technologies/', '/apps/', '301'])
    // A splat already matches the slash, so it is not doubled.
    expect(rules.filter(([from]) => from === '/u/*')).toHaveLength(1)
    expect(rules).not.toContainEqual(['/u/*/', '/app-shell.html', '200'])
  })

  test('collapses locale prefixes this build wrote no documents for', () => {
    expect(rules).toContainEqual(['/fr/*', '/:splat', '301'])
    expect(rules).toContainEqual(['/en/*', '/:splat', '301'])
    expect(rules).not.toContainEqual(['/es/*', '/:splat', '301'])
  })

  test('sends the unmirrored docs tree back to its single English copy', () => {
    expect(rules).toContainEqual(['/es/developers/docs/*', '/developers/docs/:splat', '301'])
    expect(rules).not.toContainEqual(['/es/developers/docs/*', '/app-shell.html', '200'])
  })

  test('keeps the asset guards ahead of everything else', () => {
    expect(rules[0]).toEqual(['/assets/*', '/asset-missing.html', '404'])
  })

  test('retires the old ecosystem URLs at the edge', () => {
    expect(rules).toContainEqual(['/technologies', '/apps/', '301'])
    expect(rules).toContainEqual(['/pay', '/peable/', '301'])
  })

  test('never 301s a locale away because the readiness API timed out', () => {
    const blind = buildRedirectsFile({
      supportedLocales: ['en', 'es', 'ca', 'fr'],
      defaultLocale: 'en',
      // What the prerender reports when `/api/locales` is unreachable: an empty
      // list that must not be read as "no locale has pages".
      mirroredLocales: [],
      localeReadinessKnown: false,
    })
    const blindRules = blind
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))
      .map((line) => line.trim().split(/\s+/))

    expect(blindRules).toContainEqual(['/es/*', '/app-shell.html', '200'])
    expect(blindRules).toContainEqual(['/fr/*', '/app-shell.html', '200'])
    expect(blindRules).not.toContainEqual(['/es/*', '/:splat', '301'])
    // The default locale's prefix is a static fact, not a CMS one.
    expect(blindRules).toContainEqual(['/en/*', '/:splat', '301'])
  })

  test('stays inside Cloudflare’s ceiling for dynamic rules', () => {
    const dynamic = rules.filter(([from]) => from?.includes('*') || from?.includes(':'))
    expect(dynamic.length).toBeLessThanOrEqual(100)
  })

  test('refuses to emit a file Cloudflare would reject', () => {
    // Every locale mirrored at once. Each adds a dynamic rule per fallback
    // family, and the deploy — not the build — is what would otherwise fail.
    expect(() =>
      buildRedirectsFile({
        supportedLocales: SUPPORTED_LOCALES,
        defaultLocale: DEFAULT_LOCALE,
        mirroredLocales: SUPPORTED_LOCALES.filter((code) => code !== DEFAULT_LOCALE),
        localeReadinessKnown: true,
      }),
    ).toThrow(/exceeds Cloudflare/)
  })
})

describe('synced docs links', () => {
  const slugs = new Set(['architecture', 'recovery', 'webui/pages'])
  const base = '/developers/docs/astro/master'

  test('rewrites a source repo\u2019s own root-relative link onto this site', () => {
    expect(rewriteSiblingDocLinks('See [Architecture](/architecture) for more.', slugs, base)).toBe(
      'See [Architecture](/developers/docs/astro/master/architecture) for more.',
    )
    expect(rewriteSiblingDocLinks('[Recovery](/recovery#reset)', slugs, base)).toBe(
      '[Recovery](/developers/docs/astro/master/recovery#reset)',
    )
    expect(rewriteSiblingDocLinks('[Pages](/webui/pages)', slugs, base)).toBe(
      '[Pages](/developers/docs/astro/master/webui/pages)',
    )
  })

  test('leaves a link that is not a sibling page alone', () => {
    // This site's own pricing page, not a docs slug that happens to be missing.
    expect(rewriteSiblingDocLinks('[Pricing](/pricing)', slugs, base)).toBe('[Pricing](/pricing)')
    expect(rewriteSiblingDocLinks('[Docs](/developers/docs/)', slugs, base)).toBe('[Docs](/developers/docs/)')
    expect(rewriteSiblingDocLinks('[Up](../architecture)', slugs, base)).toBe('[Up](../architecture)')
  })
})
