/**
 * `dist/_redirects` — what Cloudflare Pages does with a path it has no file for.
 *
 * The file used to end in a single blanket rule:
 *
 *     /*  /index.html  200
 *
 * `dist/index.html` is not a neutral shell, though: it is the prerendered HOME
 * PAGE, carrying `<title>Oxy, an open-source ecosystem…</title>` and
 * `<link rel="canonical" href="https://oxy.so/">`. So every misspelling, every
 * stale inbound link and every retired URL answered HTTP 200 with a byte-exact
 * copy of the home page that claimed the home page's canonical. Search Console
 * reported the consequences under three separate headings — "Soft 404",
 * "Duplicate without user-selected canonical", and "Duplicate, Google chose a
 * different canonical than the user".
 *
 * The replacement splits that one rule in two:
 *
 *  - Surfaces whose document legitimately may not exist yet at build time
 *    (a Newsroom post published after the deploy, a job opening, a feature
 *    request, anything behind a sign-in) rewrite to `app-shell.html`: the same
 *    bundle with the home page's identity stripped out. React mounts and
 *    `<SEO>` writes the real meta.
 *  - Everything else is genuinely not a page on this site and gets
 *    `404.html` with a real 404 status.
 *
 * Prerendered routes are untouched by either: Cloudflare serves a matching
 * static asset before it consults this file, which is also why the `/assets/*`
 * rule below can 404 without taking the real bundles down with it.
 *
 * Generated rather than hand-written because the locale rules depend on which
 * locales this build actually mirrored — a fact only the prerender knows.
 */

/**
 * Route families the SPA must answer itself. Each is either user-specific or
 * driven by content created between deploys, so the absence of a prerendered
 * document says nothing about whether the page exists.
 *
 * `/developers/docs/*` is here for a different reason: the docs tree is synced
 * at build time, but it also hosts the client-only Bloom playground, colour
 * system and `_demo` isolation routes, which have no document by design.
 */
export const SPA_FALLBACK_PATTERNS: readonly string[] = [
  '/admin',
  '/admin/*',
  '/dashboard',
  '/settings',
  '/u/*',
  '/newsroom/*',
  '/company/careers/*',
  '/apps/*',
  '/features/*',
  '/referrals/dashboard',
  '/developers/docs/*',
  '/faircoin/*',
  // The fairco.in apex mounts the FairCoin dApp at the ROOT of this same build
  // (`isFairCoinHost()` in src/App.tsx), so these five paths are that site's
  // real pages even though no document is written for them here.
  '/buy',
  '/unwrap',
  '/redeem',
  '/bridge',
  '/wallet',
]

/** Retired URLs that are still linked from outside. */
const LEGACY_REDIRECTS: ReadonlyArray<readonly [from: string, to: string]> = [
  ['/technologies', '/apps/'],
  ['/products', '/apps/'],
  ['/pay', '/peable/'],
]

export interface RedirectsOptions {
  /** Every locale the app routes, including the default one. */
  supportedLocales: readonly string[]
  /** The locale served at the bare path; it never has its own prefix. */
  defaultLocale: string
  /** Locales this build actually wrote `/<code>/…` documents for. */
  mirroredLocales: readonly string[]
  /**
   * Whether `mirroredLocales` is an answer or a shrug.
   *
   * It comes from `/api/locales`, and the prerender treats an unreachable API
   * as "no locales" so a backend outage cannot fail a build. That default is
   * safe for emitting documents and catastrophic here: an empty list would be
   * read as "no locale has pages", and every `/es/…` URL on the live site
   * would start 301-ing to its English counterpart because one fetch timed
   * out. When the answer is not known, locale prefixes keep the old behaviour
   * — the SPA renders them — and nothing about the index changes.
   */
  localeReadinessKnown: boolean
}

/**
 * One rule line. Columns are padded for readability but never joined: a
 * destination wider than its column still has to end in whitespace, or
 * `/developers/docs/:splat` and `301` fuse into a rule Cloudflare reads as a
 * redirect to `/developers/docs/:splat301`.
 */
function line(from: string, to: string, status: number): string {
  return `${from.padEnd(34)} ${to.padEnd(24)} ${status}`
}

/**
 * A rule, in both the bare and the trailing-slash form.
 *
 * Cloudflare matches a `_redirects` source literally, and every link on this
 * site now points at the trailing-slash URL — so a rule written only as
 * `/dashboard` would leave a reload of `/dashboard/` to fall through to the
 * catch-all and 404. A splat already matches the slash (`/u/*` covers `/u/me/`),
 * so only literal sources are doubled.
 */
function rule(from: string, to: string, status: number): string[] {
  if (from.includes('*') || from.endsWith('/')) return [line(from, to, status)]
  return [line(from, to, status), line(`${from}/`, to, status)]
}

export function buildRedirectsFile(opts: RedirectsOptions): string {
  const lines: string[] = []
  const push = (...values: string[]) => lines.push(...values)

  push(
    '# Generated by scripts/redirects.ts during `postbuild`. Do not edit by hand.',
    '',
    '# Static asset folders — a real 404 rather than the SPA shell when the file is',
    '# missing. Prevents the browser "MIME type text/html" error when a cached',
    '# index.html references a stale hashed bundle after a deploy.',
    ...rule('/assets/*', '/asset-missing.html', 404),
    ...rule('/images/*', '/asset-missing.html', 404),
    ...rule('/fonts/*', '/asset-missing.html', 404),
    ...rule('/models/*', '/asset-missing.html', 404),
    '',
  )

  push('# Retired URLs, redirected at the edge so crawlers see one permanent hop')
  push('# instead of a 200 that turns into a client-side <Navigate>.')
  for (const [from, to] of LEGACY_REDIRECTS) push(...rule(from, to, 301))
  push('')

  const prefixed = opts.supportedLocales.filter((code) => code !== opts.defaultLocale)

  // The default locale lives at the bare path by construction, not by CMS
  // state, so this one holds whether or not the readiness fetch succeeded.
  push(
    '# The default locale is served at the bare path, always — `/en/pricing/` is a',
    '# second URL for a page that already has one.',
    ...rule(`/${opts.defaultLocale}`, '/', 301),
    ...rule(`/${opts.defaultLocale}/*`, '/:splat', 301),
    '',
  )

  if (!opts.localeReadinessKnown) {
    push(
      '# `/api/locales` did not answer during this build, so which locales have pages',
      '# is unknown. Hand every prefix to the SPA, as the old blanket fallback did:',
      '# wrong-but-harmless beats 301-ing a live translated URL away on a timeout.',
    )
    for (const code of prefixed) push(...rule(`/${code}/*`, '/app-shell.html', 200))
    push('')
  }

  const unmirrored = opts.localeReadinessKnown
    ? prefixed.filter((code) => !opts.mirroredLocales.includes(code))
    : []
  if (unmirrored.length > 0) {
    push(
      '# Locale prefixes with no documents in this build: locales the app can route',
      '# but that have not crossed the translation-readiness threshold, so there is',
      '# nothing at `/<code>/…` to serve. Collapsing them to the bare path keeps an',
      '# old or hand-typed URL working, and keeps it out of the index as a duplicate.',
    )
    for (const code of unmirrored) {
      push(...rule(`/${code}`, '/', 301))
      push(...rule(`/${code}/*`, '/:splat', 301))
    }
    push('')
  }

  const mirrored = opts.localeReadinessKnown ? opts.mirroredLocales : []
  if (mirrored.length > 0) {
    push(
      '# Mirrored locales do not mirror the synced developer documentation — it has',
      '# no translated source, so `/es/developers/docs/…` only ever served the',
      '# English page under a second URL. See src/lib/localizedRoute.ts.',
    )
    for (const code of mirrored) {
      push(...rule(`/${code}/developers/docs`, '/developers/docs/', 301))
      push(...rule(`/${code}/developers/docs/*`, '/developers/docs/:splat', 301))
    }
    push('')
  }

  push('# Surfaces the SPA renders from live data or behind a sign-in.')
  for (const pattern of SPA_FALLBACK_PATTERNS) push(...rule(pattern, '/app-shell.html', 200))
  for (const code of mirrored) {
    for (const pattern of SPA_FALLBACK_PATTERNS) {
      if (pattern.startsWith('/developers/docs')) continue
      push(...rule(`/${code}${pattern}`, '/app-shell.html', 200))
    }
  }
  push('')

  push(
    '# Anything else is not a page on this site. A real 404 status is what stops a',
    '# retired URL from being re-crawled forever as a home-page duplicate.',
    ...rule('/*', '/404.html', 404),
    '',
  )

  const contents = lines.join('\n')
  assertWithinCloudflareLimits(contents, opts)
  return contents
}

/**
 * Cloudflare Pages caps a `_redirects` file at 2,100 rules, of which at most
 * 100 may carry a splat or a placeholder — and it enforces that by REJECTING
 * the deploy, after a green build. Each mirrored locale adds one dynamic rule
 * per dynamic fallback family, so the ceiling is a real limit on how many
 * locales can go live at once, not a theoretical one.
 *
 * Failing here names the cause. The alternative is a build that passes, a
 * deploy that does not, and an error message about a file nobody wrote by hand.
 */
const CF_MAX_RULES = 2_100
const CF_MAX_DYNAMIC_RULES = 100

function assertWithinCloudflareLimits(contents: string, opts: RedirectsOptions): void {
  const sources = contents
    .split('\n')
    .filter((line) => line.trim() && !line.startsWith('#'))
    .map((line) => line.trim().split(/\s+/)[0] ?? '')
  const dynamic = sources.filter((from) => from.includes('*') || from.includes(':'))
  if (sources.length <= CF_MAX_RULES && dynamic.length <= CF_MAX_DYNAMIC_RULES) return
  throw new Error(
    `[redirects] ${sources.length} rules (${dynamic.length} with a splat or placeholder) ` +
      `exceeds Cloudflare's ${CF_MAX_RULES}/${CF_MAX_DYNAMIC_RULES} limits, which would ` +
      `reject the deploy. ${opts.mirroredLocales.length} locale(s) are mirrored and each ` +
      `adds one dynamic rule per entry in SPA_FALLBACK_PATTERNS — mirror fewer locales, or ` +
      `fold the per-locale fallbacks into one ':locale' placeholder rule.`,
  )
}
