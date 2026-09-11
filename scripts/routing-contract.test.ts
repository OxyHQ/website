#!/usr/bin/env bun
/**
 * The build now answers an unknown path with a real 404 instead of the home
 * page (see scripts/redirects.ts). That is only safe while every route the app
 * declares still resolves — a route family that is neither prerendered nor
 * listed in `SPA_FALLBACK_PATTERNS` would 404 in production while working
 * perfectly in `bun run dev`, and nothing else in the build would notice.
 *
 * So this reads the route table out of `src/App.tsx`, the documents out of
 * `dist/`, and the rules out of `dist/_redirects`, and asserts that each
 * declared route is reachable one way or the other. Adding a route without a
 * document or a fallback fails the build that would have shipped it.
 *
 * Runs in `postbuild`, against the artifact that is about to be uploaded.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dir, '..')
const DIST = path.join(ROOT, 'dist')

interface RedirectRule {
  from: string
  to: string
  status: number
}

function parseRedirects(contents: string): RedirectRule[] {
  return contents
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const [from, to, status] = line.split(/\s+/)
      return { from: from ?? '', to: to ?? '', status: Number(status ?? 200) }
    })
}

/**
 * Cloudflare's matcher, reduced to the two forms this file uses: a trailing
 * `*` splat and a `:placeholder` standing for exactly one segment.
 */
function ruleMatches(rule: RedirectRule, pathname: string): boolean {
  const pattern = rule.from
  const source = pattern
    .split('/')
    .map((segment) => {
      if (segment === '*') return '.*'
      if (segment.startsWith(':')) return '[^/]+'
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  // Exact, like Cloudflare: `/dashboard` does not match `/dashboard/`. The
  // generator emits both forms for literal sources precisely because of this.
  return new RegExp(`^${source}$`).test(pathname)
}

/** Every route path literal in the app's route table, as declared. */
function declaredRoutes(): string[] {
  const source = readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8')
  const found = new Set<string>()
  for (const match of source.matchAll(/path="([^"]*)"/g)) {
    const value = match[1] ?? ''
    // `*` and `/` are the catch-all and the layout root, not addressable pages.
    if (value === '' || value === '*' || value === '/') continue
    found.add(value.startsWith('/') ? value : `/${value}`)
  }
  return [...found].sort()
}

/** Every route this build wrote a document for, as a bare path. */
function prerenderedRoutes(): Set<string> {
  const out = new Set<string>()
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), `${prefix}/${entry.name}`)
      } else if (entry.name === 'index.html') {
        out.add(prefix === '' ? '/' : prefix)
      }
    }
  }
  walk(DIST, '')
  return out
}

function patternToRegExp(routePath: string): RegExp {
  const source = routePath
    .split('/')
    .map((segment) => {
      if (segment === '*') return '.+'
      if (segment.startsWith(':')) return '[^/]+'
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  return new RegExp(`^${source}$`)
}

function main(): void {
  if (!existsSync(DIST)) throw new Error('[routing-contract] dist missing — run the build first')
  const redirectsFile = path.join(DIST, '_redirects')
  if (!existsSync(redirectsFile)) throw new Error('[routing-contract] dist/_redirects missing')

  const rules = parseRedirects(readFileSync(redirectsFile, 'utf8'))
  const catchAll = rules.at(-1)
  if (!catchAll || catchAll.from !== '/*' || catchAll.status !== 404) {
    throw new Error('[routing-contract] _redirects must end in a `/*  /404.html  404` rule')
  }
  const reachable = rules.slice(0, -1)
  const documents = prerenderedRoutes()
  for (const required of ['/', '/404.html', '/app-shell.html']) {
    const file = required === '/' ? 'index.html' : required.slice(1)
    if (!existsSync(path.join(DIST, file))) {
      throw new Error(`[routing-contract] dist/${file} missing`)
    }
  }

  /**
   * Whether a concrete path gets an answer other than the catch-all 404:
   * a document (Cloudflare serves it, 308-ing the bare form onto it), or a
   * rule ahead of the catch-all.
   */
  const resolves = (pathname: string): boolean => {
    const bare = pathname.replace(/\/+$/, '') || '/'
    if (documents.has(bare)) return true
    return reachable.some((rule) => ruleMatches(rule, pathname))
  }

  const unreachable: string[] = []
  for (const route of declaredRoutes()) {
    // A sample instance of the family: `/u/:username` -> `/u/x`.
    const sample = route.replace(/[:*][^/]*/g, 'x')
    // Both forms, because they are two different requests. Links now publish
    // the trailing-slash one, so a rule written only as `/dashboard` would let
    // a reload of `/dashboard/` fall through to the 404.
    if (resolves(sample) && resolves(`${sample}/`)) continue
    if (route.includes(':') || route.includes('*')) {
      // Build-time-enumerated family: at least one real instance must exist,
      // otherwise nothing under it would resolve.
      const pattern = patternToRegExp(route)
      if ([...documents].some((doc) => pattern.test(doc))) continue
    }
    unreachable.push(route)
  }

  if (unreachable.length > 0) {
    throw new Error(
      `[routing-contract] ${unreachable.length} declared route(s) would answer 404 in production:\n` +
        unreachable.map((route) => `  ${route}`).join('\n') +
        '\n\nEither prerender them, or add the family to SPA_FALLBACK_PATTERNS in scripts/redirects.ts.',
    )
  }

  // The other half of the contract: a path the app does not route must NOT be
  // absorbed by a fallback rule, or the 404 is decorative.
  const mustNotMatch = ['/definitely-not-a-page', '/pricing-old', '/newsroom-old/thing']
  const absorbed = mustNotMatch.filter((p) => reachable.some((rule) => ruleMatches(rule, p)))
  if (absorbed.length > 0) {
    throw new Error(`[routing-contract] fallback rules swallow unknown paths: ${absorbed.join(', ')}`)
  }

  console.log(
    `[routing-contract] ok — ${declaredRoutes().length} declared routes, ` +
      `${documents.size} documents, ${rules.length} redirect rules`,
  )
}

main()
