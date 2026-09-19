#!/usr/bin/env bun
/**
 * Resolve every internal URL this build publishes against the build itself.
 *
 * `internal-links.test.ts` checks the SHAPE of a link; this checks that the
 * link goes somewhere. It replays Cloudflare Pages' own resolution order over
 * `dist/` — static file, then directory index, then the trailing-slash 308,
 * then `_redirects` — for three sets of URLs:
 *
 *   1. every literal `to=` / `href=` in `src/` (the chrome and the hard-coded
 *      calls to action, which no amount of prerendering will reveal),
 *   2. every `href` in every prerendered document (prose links out of the
 *      newsroom, the docs and the help centre),
 *   3. every `<loc>` and every hreflang `href` in `sitemap.xml`.
 *
 * A link that answers 301/308 is a finding, not just a 404: a redirect
 * advertised as this site's own idea of where a page lives is what put 725
 * URLs in Search Console under "Page with redirect".
 *
 * The edge middleware's fallback counts as resolving — those surfaces have no
 * document by design, and `scripts/routing-contract.test.ts` is what checks the
 * list itself stays honest.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { canonicalTo } from '../src/lib/canonicalPath'
import { isSpaFallbackPath } from '../src/lib/spaFallback'

const ROOT = path.resolve(import.meta.dir, '..')
const DIST = path.join(ROOT, 'dist')
const SITE_ORIGIN = process.env.SITE_URL || 'https://oxy.so'

interface Rule {
  from: string
  to: string
  status: number
}

type Resolution = { status: number; detail?: string }

function loadRules(): Rule[] {
  return readFileSync(path.join(DIST, '_redirects'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const [from, to, status] = line.split(/\s+/)
      return { from: from ?? '', to: to ?? '', status: Number(status ?? 200) }
    })
}

function ruleMatches(from: string, pathname: string): boolean {
  const source = from
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

/** Cloudflare Pages, as far as this build is concerned. */
function resolve(pathname: string, rules: readonly Rule[]): Resolution {
  const clean = pathname.replace(/\/+$/, '')
  const asFile = path.join(DIST, clean)
  if (clean !== '' && existsSync(asFile) && statSync(asFile).isFile()) return { status: 200 }
  const asIndex = path.join(DIST, clean, 'index.html')
  if (existsSync(asIndex)) {
    // A document is served at `<path>/`; the bare form is a 308 to it.
    return pathname.endsWith('/') ? { status: 200 } : { status: 308, detail: `${pathname}/` }
  }
  for (const rule of rules) {
    if (ruleMatches(rule.from, pathname)) {
      // `functions/_middleware.ts` upgrades the catch-all 404 to the app shell
      // for the surfaces the SPA owns. Those resolve; they just do not have a
      // document.
      if (rule.status === 404 && isSpaFallbackPath(pathname)) return { status: 200 }
      return { status: rule.status, detail: rule.to }
    }
  }
  return isSpaFallbackPath(pathname) ? { status: 200 } : { status: 404 }
}

function walk(dir: string, match: (file: string) => boolean): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(abs, match))
    else if (match(abs)) out.push(abs)
  }
  return out
}

/** A site-internal pathname, or null for anything this build does not serve. */
function internalPath(raw: string): string | null {
  let value = raw.trim()
  if (value.startsWith(SITE_ORIGIN)) value = value.slice(SITE_ORIGIN.length) || '/'
  if (!value.startsWith('/') || value.startsWith('//')) return null
  const pathname = value.split(/[?#]/)[0] ?? ''
  return pathname === '' ? null : pathname
}

interface Finding {
  pathname: string
  status: number
  detail?: string
  sources: Set<string>
}

/**
 * A `to=` in a component is not the URL that ships — `src/lib/navigation`
 * normalises it at render time. Checking the literal would report a redirect
 * for a link that renders correctly, so source targets are normalised the same
 * way first and only their DESTINATION is audited. Emitted HTML and the sitemap
 * are checked exactly as written: there is nothing left to normalise them.
 */
function normalizeSourceTarget(raw: string): string {
  const to = canonicalTo(raw)
  return typeof to === 'string' ? to : raw
}

function main(): void {
  if (!existsSync(DIST)) throw new Error('[link-audit] dist missing — run the build first')
  const rules = loadRules()
  const targets = new Map<string, Set<string>>()
  const record = (raw: string, source: string) => {
    const pathname = internalPath(raw)
    if (pathname === null) return
    const sources = targets.get(pathname) ?? new Set<string>()
    sources.add(source)
    targets.set(pathname, sources)
  }

  for (const file of walk(path.join(ROOT, 'src'), (f) => /\.tsx?$/.test(f))) {
    const source = readFileSync(file, 'utf8')
    const rel = path.relative(ROOT, file)
    for (const match of source.matchAll(/\b(?:to|href)="(\/[^"]*)"/g)) {
      record(normalizeSourceTarget(match[1] ?? ''), rel)
    }
  }

  // `dist/*-content/` are the build-only stub trees Pagefind indexes; they are
  // deleted later in `postbuild` and never served, so their markup is not a
  // published URL.
  const isStubTree = (file: string) =>
    path.relative(DIST, file).split(path.sep)[0]?.endsWith('-content') === true

  for (const file of walk(DIST, (f) => f.endsWith('.html') && !isStubTree(f))) {
    const html = readFileSync(file, 'utf8')
    const rel = path.relative(DIST, file)
    for (const match of html.matchAll(/<a\b[^>]*?\shref="([^"]+)"/g)) record(match[1] ?? '', `dist/${rel}`)
  }

  const sitemap = path.join(DIST, 'sitemap.xml')
  if (existsSync(sitemap)) {
    const xml = readFileSync(sitemap, 'utf8')
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) record(match[1] ?? '', 'sitemap.xml <loc>')
    for (const match of xml.matchAll(/<xhtml:link[^>]*href="([^"]+)"/g)) {
      record(match[1] ?? '', 'sitemap.xml hreflang')
    }
  }

  const findings: Finding[] = []
  for (const [pathname, sources] of targets) {
    const { status, detail } = resolve(pathname, rules)
    // A 200 is the only acceptable answer for a URL this site publishes itself.
    if (status === 200) continue
    findings.push({ pathname, status, detail, sources })
  }

  findings.sort((a, b) => a.status - b.status || a.pathname.localeCompare(b.pathname))
  if (findings.length > 0) {
    console.error(`[link-audit] ${findings.length} published URL(s) do not resolve to a document:`)
    for (const finding of findings) {
      const where = [...finding.sources].slice(0, 3).join(', ')
      const extra = finding.sources.size > 3 ? ` (+${finding.sources.size - 3} more)` : ''
      console.error(
        `  ${String(finding.status).padEnd(4)} ${finding.pathname}` +
          `${finding.detail ? ` -> ${finding.detail}` : ''}\n       linked from ${where}${extra}`,
      )
    }
    // Strict by default, like the prerender: shipping a link the site itself
    // knows is broken is how eight dead URLs sat in the Astro docs long enough
    // for Search Console to file them. Some findings can come from upstream
    // prose this repo does not own, though, and a docs sync should not be able
    // to block a deploy of the whole site at 2am — `LINK_AUDIT_STRICT=0`
    // downgrades the run to a report.
    if (process.env.LINK_AUDIT_STRICT === '0') {
      console.error('[link-audit] LINK_AUDIT_STRICT=0 — reporting only.')
      return
    }
    process.exit(1)
  }

  console.log(`[link-audit] ok — ${targets.size} internal URLs, every one resolves to a document`)
}

main()
