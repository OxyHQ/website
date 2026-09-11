import { describe, expect, test } from 'bun:test'
import { canonicalTo, canonicalHref } from '../src/lib/canonicalPath'
import { hasLocalizedVariants } from '../src/lib/localizedRoute'
import { buildRedirectsFile } from './redirects'
import { isSpaFallbackPath } from '../src/lib/spaFallback'
import { buildSitemapXml } from './sitemap'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../src/lib/i18n/types'
import { rewriteSiblingDocLinks, rewriteStaleDocsVersionLinks } from './docs-links'

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

  test('contains no rewrite rule that could shadow a document', () => {
    // A `200` rewrite is matched BEFORE the static asset, so any such rule over
    // a prefix that has documents hides them. `/newsroom/*  /app-shell.html  200`
    // shadowed all fifteen prerendered Newsroom posts in production, and
    // `/developers/docs/*` shadowed 2,087. The SPA fallback lives in the edge
    // middleware now; nothing here may rewrite to the shell.
    expect(rules.filter(([, to]) => to === '/app-shell.html')).toHaveLength(0)
    const rewrites = rules.filter(([, , status]) => status === '200')
    expect(rewrites).toHaveLength(0)
  })

  test('the only splat that can reach a document is the catch-all Pages skips', () => {
    const splats = rules.filter(([from]) => from?.endsWith('/*'))
    for (const [from, , status] of splats) {
      // Every other splat covers a prefix this build writes no documents under.
      expect(from === '/*' || from?.startsWith('/assets') || from?.startsWith('/images') ||
        from?.startsWith('/fonts') || from?.startsWith('/models') || /^\/[a-z]{2}\//.test(from ?? '')).toBe(true)
      expect(status === '404' || status === '301').toBe(true)
    }
  })

  test('covers the trailing-slash form of every literal rule', () => {
    // Every link on the site now points at `/technologies/`, and Cloudflare
    // matches a source literally — a rule written only as `/technologies` would
    // let that form fall through to the catch-all.
    expect(rules).toContainEqual(['/technologies', '/apps/', '301'])
    expect(rules).toContainEqual(['/technologies/', '/apps/', '301'])
    // A splat already matches the slash, so it is not doubled.
    expect(rules.filter(([from]) => from === '/en/*')).toHaveLength(1)
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

  test('the real locale list stays well inside the ceiling', () => {
    const everyLocaleMirrored = buildRedirectsFile({
      supportedLocales: SUPPORTED_LOCALES,
      defaultLocale: DEFAULT_LOCALE,
      mirroredLocales: SUPPORTED_LOCALES.filter((code) => code !== DEFAULT_LOCALE),
      localeReadinessKnown: true,
    })
    const dynamic = everyLocaleMirrored
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'))
      .map((line) => line.trim().split(/\s+/)[0] ?? '')
      .filter((from) => from.includes('*') || from.includes(':'))
    expect(dynamic.length).toBeLessThanOrEqual(100)
  })

  test('refuses to emit a file Cloudflare would reject', () => {
    // Each mirrored locale contributes a splat rule, so enough of them would
    // push the file past a limit the DEPLOY enforces, not the build. Failing
    // here names the cause instead.
    const many = Array.from({ length: 150 }, (_, i) => `l${i}`)
    expect(() =>
      buildRedirectsFile({
        supportedLocales: ['en', ...many],
        defaultLocale: 'en',
        mirroredLocales: many,
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

describe('SPA fallback (edge middleware)', () => {
  test('claims the surfaces that have no build-time document', () => {
    for (const path of [
      '/dashboard', '/dashboard/', '/settings/', '/admin', '/admin/categories',
      '/u/nate/', '/u/nate/followers', '/referrals/dashboard/',
      '/newsroom/a-post-published-after-the-deploy/',
      '/company/careers/a-new-opening/', '/apps/a-new-product/',
      '/features/OxyHQ/oxy/999/',
      '/developers/docs/bloom/playground/', '/developers/docs/bloom/1.0.0/color-system/',
      '/developers/docs/bloom/_demo/button/', '/developers/docs/api/v1/',
      '/faircoin/redeem/', '/buy/', '/wallet',
      '/es/u/nate/', '/es/newsroom/a-post/',
    ]) {
      expect({ path, claimed: isSpaFallbackPath(path) }).toEqual({ path, claimed: true })
    }
  })

  test('leaves everything else to the 404', () => {
    for (const path of [
      '/', '/pricing/', '/definitely-not-a-page/', '/newsroom/', '/apps/',
      '/developers/docs/bloom/1.0.0/', '/help/auth/2fa-setup/', '/legal/privacy/',
      '/newsroom/a/b/', '/app-shell',
    ]) {
      expect({ path, claimed: isSpaFallbackPath(path) }).toEqual({ path, claimed: false })
    }
  })
})

describe('synced docs links that name a version this site does not serve', () => {
  const slugs = new Set(['label', 'input-group', 'api/variables/Z_INDEX'])
  const base = '/developers/docs/bloom/1.0.0'

  test('repoints an upstream branch name onto the synced version', () => {
    expect(
      rewriteStaleDocsVersionLinks('[Label](/developers/docs/bloom/main/label)', slugs, 'bloom', base),
    ).toBe('[Label](/developers/docs/bloom/1.0.0/label)')
    expect(
      rewriteStaleDocsVersionLinks('[G](/developers/docs/bloom/main/input-group#api)', slugs, 'bloom', base),
    ).toBe('[G](/developers/docs/bloom/1.0.0/input-group#api)')
  })

  test('leaves a link alone when dropping the segment does not name a page', () => {
    const gone = '[X](/developers/docs/bloom/main/not-a-component)'
    expect(rewriteStaleDocsVersionLinks(gone, slugs, 'bloom', base)).toBe(gone)
    const other = '[Y](/developers/docs/core/main/label)'
    expect(rewriteStaleDocsVersionLinks(other, slugs, 'bloom', base)).toBe(other)
  })

  test('a link already on the right version is normalised, not mangled', () => {
    expect(
      rewriteStaleDocsVersionLinks('[Z](/developers/docs/bloom/api/variables/Z_INDEX)', slugs, 'bloom', base),
    ).toBe('[Z](/developers/docs/bloom/1.0.0/api/variables/Z_INDEX)')
  })

  test('recovers a link that dropped the package segment', () => {
    // Allo writes `](/developers/docs/matrix/data-model)` for a page this build
    // serves under `allo/`.
    const alloSlugs = new Set(['matrix/data-model'])
    expect(
      rewriteStaleDocsVersionLinks(
        '[Model](/developers/docs/matrix/data-model)',
        alloSlugs,
        'allo',
        '/developers/docs/allo',
      ),
    ).toBe('[Model](/developers/docs/allo/matrix/data-model)')
  })

  test('never captures a genuine cross-package link', () => {
    // `core` is another package, and nothing in this slug set claims it.
    const untouched = '[Core](/developers/docs/core/main/api)'
    expect(rewriteStaleDocsVersionLinks(untouched, slugs, 'bloom', base)).toBe(untouched)
  })
})
