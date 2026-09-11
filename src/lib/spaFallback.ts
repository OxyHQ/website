/**
 * Paths the SPA must answer itself, because no document for them exists in the
 * build.
 *
 * These used to be `200` rewrites in `_redirects`, and that was wrong in a way
 * only production showed: **a rewrite rule in `_redirects` is matched before
 * the static asset**, so `/newsroom/*  /app-shell.html  200` shadowed all 15
 * prerendered Newsroom documents, `/developers/docs/*` shadowed 2,087, and
 * Pages then answered each one with a 308 to `/app-shell` (its own `.html`
 * stripping applied to the rewrite target). The bare `/*` catch-all is the one
 * rule Pages skips when an asset matches — which is exactly why the SPA idiom
 * works, and why it is the only splat left in that file.
 *
 * So the fallback moved to `functions/_middleware.ts`, which sees the 404 the
 * catch-all produced and upgrades it. A document always wins now, because the
 * middleware only ever looks at requests that found none.
 */
const SPA_FALLBACK_PATTERNS: readonly RegExp[] = [
  // Signed-in and per-user surfaces, deliberately never prerendered.
  /^\/admin(?:\/.*)?$/,
  /^\/dashboard$/,
  /^\/settings$/,
  /^\/u\/[^/]+(?:\/(?:followers|following))?$/,
  /^\/referrals\/dashboard$/,
  // CMS- and GitHub-driven content, which can be published between deploys.
  /^\/newsroom\/[^/]+$/,
  /^\/company\/careers\/[^/]+$/,
  /^\/apps\/[^/]+$/,
  /^\/features\/[^/]+\/[^/]+\/[^/]+$/,
  // Client-only docs surfaces: the Bloom playground, colour system and the
  // `_demo` isolation route have no document by design.
  /^\/developers\/docs\/api(?:\/[^/]+)?$/,
  /^\/developers\/docs\/bloom\/(?:[^/]+\/)?(?:playground|color-system)$/,
  /^\/developers\/docs\/bloom\/_demo(?:\/[^/]+)?$/,
  // The FairCoin dApp needs a wallet to mean anything. On fairco.in these are
  // mounted at the apex, so both shapes have to resolve.
  /^(?:\/faircoin)?\/(?:buy|unwrap|redeem|bridge|wallet)$/,
]

/** Locale prefixes are stripped before matching, so `/es/u/nate` resolves too. */
const LOCALE_PREFIX = /^\/[a-z]{2}(?=\/)/

/** True when the SPA, not a document, is the right answer for `pathname`. */
export function isSpaFallbackPath(pathname: string): boolean {
  const trimmed = pathname.replace(/\/+$/, '') || '/'
  const bare = trimmed.replace(LOCALE_PREFIX, '') || '/'
  return SPA_FALLBACK_PATTERNS.some((p) => p.test(trimmed) || p.test(bare))
}

export { SPA_FALLBACK_PATTERNS }
