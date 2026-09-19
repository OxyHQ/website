#!/usr/bin/env bun
/**
 * Internal links must already point at the canonical URL.
 *
 * Cloudflare answers `/pricing` with a 308 to `/pricing/`, so a
 * `<Link to="/pricing">` publishes a redirect as the site's own idea of where
 * that page lives. Googlebot crawls hrefs, so the entire route tree was
 * discovered in its redirecting shape: 725 URLs sat in Search Console under
 * "Page with redirect" while the canonical tag and the sitemap pointed at the
 * trailing-slash form that nothing on the site linked to.
 *
 * `src/lib/navigation.tsx` fixes that for every routed link, and for the URL a
 * client-side `Navigate` leaves in the address bar. This guards the two ways
 * around it: importing those components straight from react-router, and
 * hand-writing an `<a href="/…">`.
 */
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dir, '..')
const NAVIGATION_MODULE = path.join(ROOT, 'src', 'lib', 'navigation.tsx')

/** Mirrors `SITE_ORIGINS` in `src/lib/canonicalPath.ts`. */
const SITE_ORIGINS: readonly string[] = ['https://oxy.so', 'https://fairco.in']

/** `public/` files are served verbatim; a slash on one of those is a 404. */
const ASSET_PREFIXES = ['/images/', '/fonts/', '/videos/', '/assets/', '/icons/', '/models/']

function isAssetHref(href: string): boolean {
  if (ASSET_PREFIXES.some((prefix) => href.startsWith(prefix))) return true
  const last = href.split(/[?#]/)[0]?.split('/').filter(Boolean).pop()
  return last !== undefined && last.includes('.')
}

/**
 * Every `.ts`/`.tsx` under `src/`.
 *
 * Deliberately `node:fs` rather than Bun's `Glob`: importing the `bun` module
 * into this project pulls a second global `Element` declaration alongside the
 * one `@cloudflare/workers-types` provides, and `tsc -b` then rejects the
 * HTMLRewriter handlers in `functions/_middleware.ts` — a file this script has
 * nothing to do with.
 */
function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sourceFiles(abs))
    else if (/\.tsx?$/.test(entry.name)) out.push(abs)
  }
  return out
}

const failures: string[] = []

for (const abs of sourceFiles(path.join(ROOT, 'src'))) {
  const file = path.relative(ROOT, abs)
  if (abs === NAVIGATION_MODULE) continue
  const source = readFileSync(abs, 'utf8')

  for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'react-router-dom'/g)) {
    const names = (match[1] ?? '').split(',').map((name) => name.trim())
    for (const name of names) {
      if (['Link', 'NavLink', 'Navigate', 'useNavigate'].includes(name)) {
        failures.push(
          `${file}: imports ${name} from 'react-router-dom' — import it from src/lib/navigation instead`,
        )
      }
    }
  }

  for (const match of source.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) {
    const raw = match[1] ?? ''
    // An absolute link to our own origin is an internal link written the long
    // way, and Cloudflare 308s it just the same.
    const href = SITE_ORIGINS.reduce(
      (value, origin) => (value.startsWith(`${origin}/`) ? value.slice(origin.length) : value),
      raw,
    )
    if (!href.startsWith('/') || href.startsWith('//')) continue
    if (isAssetHref(href)) continue
    const pathname = href.split(/[?#]/)[0] ?? ''
    if (pathname.endsWith('/')) continue
    const suggested = raw.replace(pathname, `${pathname}/`)
    failures.push(`${file}: <a href="${raw}"> redirects — write "${suggested}" or use <Link>`)
  }
}

if (failures.length > 0) {
  console.error(`[internal-links] ${failures.length} link(s) point at a redirecting URL:`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log('[internal-links] ok — every internal link points at its canonical URL')
