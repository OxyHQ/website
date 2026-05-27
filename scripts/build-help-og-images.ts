#!/usr/bin/env bun
/**
 * build-help-og-images.ts — pre-render OG/card images for help articles.
 *
 * Walks every `src/content/help/**.mdx` file, reads its YAML frontmatter,
 * and renders a 1200×630 brand-consistent card to
 * `public/images/help-og/<slug>.png` using satori (React → SVG) +
 * @resvg/resvg-js (SVG → PNG). No headless browser, ~50ms per image.
 *
 * Output is deterministic: same inputs always produce the same PNG bytes,
 * so the committed files survive repeat runs unchanged. Authors who set
 * `coverImage:` in their frontmatter opt out — we skip those slugs entirely.
 *
 * Wired into the `prebuild` script after sync-docs + sync-changelog so the
 * fallback images exist before Vite reads the help-loader.
 *
 * Run manually: `bun scripts/build-help-og-images.ts`
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { createElement, type ReactElement } from 'react'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..')
const HELP_DIR = path.join(WEBSITE_ROOT, 'src', 'content', 'help')
const OUTPUT_DIR = path.join(WEBSITE_ROOT, 'public', 'images', 'help-og')
const APPS_DIR = path.join(WEBSITE_ROOT, 'public', 'images', 'apps')
const FONTS_DIR = path.join(WEBSITE_ROOT, 'public', 'fonts')

const CARD_WIDTH = 1200
const CARD_HEIGHT = 630

/* ─── Frontmatter parsing (minimal, single-purpose) ─── */

/**
 * Subset of HelpFrontmatter we read for OG cards. We deliberately don't
 * import the zod schema from `src/content/schemas.ts` because that module
 * lives in app-space (Vite glob + zod runtime) and our script is a small
 * Bun process — keeping the parse minimal avoids dragging the whole app
 * graph into the build script.
 */
interface ArticleMeta {
  /** Slug relative to `src/content/help/`, no extension, no locale suffix. */
  slug: string
  /** Locale: `en` when no `.{locale}.mdx` suffix is present. */
  locale: string
  title: string
  category: string
  /** Author-set cover. When present, we skip generation for this slug. */
  coverImage: string | null
}

const LOCALE_SUFFIX_RE = /\.([a-z]{2})\.mdx$/

/**
 * Tiny YAML frontmatter parser tailored to the shape our help articles
 * actually use: `key: value` lines, with optional quoted strings and
 * inline `[a, b]` arrays. We don't need the full YAML spec — and pulling
 * in gray-matter just for this would be overkill. Throws if the file is
 * missing a frontmatter block so we never silently drop articles.
 */
function parseFrontmatter(raw: string, sourcePath: string): Record<string, string> {
  if (!raw.startsWith('---')) {
    throw new Error(`[help-og] ${sourcePath}: missing frontmatter block`)
  }
  const end = raw.indexOf('\n---', 3)
  if (end === -1) {
    throw new Error(`[help-og] ${sourcePath}: unterminated frontmatter block`)
  }
  const block = raw.slice(3, end)
  const out: Record<string, string> = {}
  for (const line of block.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx === -1) continue
    const key = trimmed.slice(0, colonIdx).trim()
    let value = trimmed.slice(colonIdx + 1).trim()
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

async function walkHelpDir(dir: string, base: string): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await walkHelpDir(fullPath, base)))
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      out.push(path.relative(base, fullPath))
    }
  }
  return out
}

function deriveSlugAndLocale(relativePath: string): { slug: string; locale: string } {
  // Normalize Windows paths defensively even though we only ship from Linux.
  const cleaned = relativePath.split(path.sep).join('/')
  const match = cleaned.match(LOCALE_SUFFIX_RE)
  if (match) {
    return { slug: cleaned.replace(LOCALE_SUFFIX_RE, ''), locale: match[1] ?? 'en' }
  }
  return { slug: cleaned.replace(/\.mdx$/, ''), locale: 'en' }
}

async function loadArticleMeta(absPath: string): Promise<ArticleMeta> {
  const raw = await readFile(absPath, 'utf8')
  const fm = parseFrontmatter(raw, absPath)
  const relative = path.relative(HELP_DIR, absPath)
  const { slug, locale } = deriveSlugAndLocale(relative)
  const title = fm.title?.trim()
  const category = fm.category?.trim()
  if (!title || !category) {
    throw new Error(`[help-og] ${absPath}: frontmatter missing title or category`)
  }
  return {
    slug,
    locale,
    title,
    category,
    coverImage: fm.coverImage?.trim() || null,
  }
}

/* ─── Brand assets ─── */

/**
 * Map a help category to the brand mark of the product it covers. Mirrors
 * `src/components/help/getHelpProductLogo.ts` so listing cards, article
 * eyebrows, and these OG cards all draw from the same asset table. Missing
 * entries fall back to "no product mark" and the card still reads as Oxy.
 */
const CATEGORY_LOGO: Record<string, string | null> = {
  account: 'accounts.png',
  inbox: 'inbox.png',
  auth: 'auth.svg',
  console: null,
  'getting-started': null,
}

/**
 * Human-readable labels mirroring HELP_CATEGORIES in the loader. Duplicated
 * here intentionally: the loader is Vite-context (eager glob) and importing
 * it would drag the entire help index into this small build script.
 */
const CATEGORY_LABEL: Record<string, string> = {
  account: 'Account',
  inbox: 'Inbox',
  auth: 'Auth & sign-in',
  console: 'Console',
  'getting-started': 'Getting started',
}

interface BrandAssets {
  /** TTF bytes for the title font (Phudu Bold — Oxy display face). */
  titleFont: Buffer
  /** TTF bytes for the body/label font (Phudu Regular). */
  bodyFont: Buffer
  /** Data-URL for the centered Oxy mark, ready to drop into <img src>. */
  oxyMarkDataUrl: string
  /** Per-category product logo data URLs (PNG or SVG). */
  productLogos: Record<string, string | undefined>
}

async function loadFontBytes(): Promise<{ title: Buffer; body: Buffer }> {
  const bold = path.join(FONTS_DIR, 'phudu', 'Phudu-Bold.ttf')
  const regular = path.join(FONTS_DIR, 'phudu', 'Phudu-Regular.ttf')
  if (!existsSync(bold) || !existsSync(regular)) {
    throw new Error(`[help-og] missing Phudu font files in ${FONTS_DIR}/phudu/`)
  }
  const [titleFont, bodyFont] = await Promise.all([readFile(bold), readFile(regular)])
  return { title: titleFont, body: bodyFont }
}

/**
 * Inline the brand mark as an `<img>` data URL. Satori supports `<img>` with
 * data URLs but does not embed external assets at render time, so prebaking
 * is the simplest path. The SVG below is a flat copy of the wordmark glyph
 * in `src/components/ui/Logo.tsx` — fill is fixed white so the SVG renders
 * identically regardless of the consumer's CSS variables (satori can't read
 * CSS custom properties).
 */
function buildOxyMarkDataUrl(): string {
  // Source: src/components/ui/Logo.tsx (the colored part). White-only so it
  // sits cleanly on the dark gradient background.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 41 22" width="82" height="44"><g fill="#ffffff"><path d="M 9.492 0.03 C 8.39 0.157 7.368 0.958 6.758 2.163 C 6.451 2.772 6.247 3.55 6.205 4.266 L 6.186 4.615 L 5.908 4.472 C 5.119 4.068 4.411 3.892 3.561 3.889 C 2.811 3.885 2.281 3.999 1.722 4.279 C 0.869 4.709 0.329 5.377 0.084 6.298 C -0.007 6.64 -0.016 7.376 0.064 7.747 C 0.252 8.588 0.669 9.359 1.292 10.014 C 1.603 10.336 2.107 10.75 2.378 10.903 C 2.449 10.945 2.511 10.987 2.511 10.997 C 2.511 11.007 2.453 11.049 2.382 11.092 C 2.104 11.251 1.606 11.662 1.299 11.984 C -0.055 13.401 -0.388 15.283 0.478 16.621 C 0.963 17.37 1.729 17.859 2.721 18.054 C 3.119 18.132 3.93 18.132 4.366 18.054 C 4.903 17.956 5.394 17.79 5.901 17.533 L 6.195 17.383 L 6.195 17.572 C 6.195 18.008 6.305 18.63 6.473 19.142 C 7.146 21.193 8.878 22.346 10.604 21.893 C 11.405 21.682 12.171 21.092 12.691 20.281 C 13.137 19.584 13.438 18.627 13.49 17.735 L 13.509 17.39 L 13.797 17.536 C 14.611 17.947 15.306 18.116 16.182 18.113 C 17 18.109 17.597 17.956 18.234 17.582 C 18.567 17.386 19.055 16.901 19.249 16.575 C 19.566 16.045 19.679 15.621 19.682 14.973 C 19.685 14.309 19.595 13.922 19.284 13.257 C 18.91 12.459 18.176 11.636 17.404 11.154 C 17.284 11.079 17.184 11.01 17.184 11.001 C 17.184 10.991 17.284 10.922 17.404 10.848 C 17.95 10.506 18.59 9.88 18.945 9.34 C 19.52 8.47 19.779 7.532 19.676 6.683 C 19.501 5.266 18.499 4.25 16.974 3.947 C 16.544 3.859 15.733 3.866 15.261 3.96 C 14.769 4.058 14.362 4.195 13.897 4.423 L 13.499 4.615 L 13.499 4.429 C 13.499 3.511 13.124 2.335 12.591 1.573 C 11.964 0.684 11.124 0.15 10.158 0.027 C 9.87 -0.009 9.838 -0.009 9.492 0.03 Z"/></g></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

async function loadProductLogos(): Promise<Record<string, string | undefined>> {
  const out: Record<string, string | undefined> = {}
  for (const [category, filename] of Object.entries(CATEGORY_LOGO)) {
    if (!filename) {
      out[category] = undefined
      continue
    }
    const filePath = path.join(APPS_DIR, filename)
    if (!existsSync(filePath)) {
      console.warn(`[help-og] missing product logo for ${category} (${filePath})`)
      out[category] = undefined
      continue
    }
    const buf = await readFile(filePath)
    const mime = filename.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
    out[category] = `data:${mime};base64,${buf.toString('base64')}`
  }
  return out
}

async function loadAssets(): Promise<BrandAssets> {
  const [{ title, body }, productLogos] = await Promise.all([
    loadFontBytes(),
    loadProductLogos(),
  ])
  return {
    titleFont: title,
    bodyFont: body,
    oxyMarkDataUrl: buildOxyMarkDataUrl(),
    productLogos,
  }
}

/* ─── Card layout (React element tree, no JSX) ─── */

/**
 * Choose a title font size that keeps long headlines on at most two lines.
 * Satori has no automatic shrink-to-fit; we approximate by character count.
 * Tuned against the longest current help titles (~45 chars) so the largest
 * headline fills the band without clipping.
 */
function chooseTitleFontSize(title: string): number {
  const n = title.length
  if (n <= 28) return 84
  if (n <= 44) return 72
  if (n <= 60) return 60
  return 52
}

/** Oxy primary purple from `src/index.css` (`--primary: hsl(277 66% 56%)`). */
const PRIMARY = '#a050d4'
/** Dark surface from the site palette — slightly cooler than pure black. */
const SURFACE = '#0a0a0b'

interface CardProps {
  title: string
  category: string
  categoryLabel: string
  productLogoDataUrl: string | undefined
  oxyMarkDataUrl: string
}

function buildCard(props: CardProps): ReactElement {
  const titleFontSize = chooseTitleFontSize(props.title)
  return createElement(
    'div',
    {
      style: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        // Diagonal Oxy purple → surface gradient. The radial bias on the
        // far corner gives the card a subtle "spotlight" without competing
        // with the title.
        backgroundImage: `linear-gradient(135deg, ${PRIMARY} 0%, #5d2e80 28%, ${SURFACE} 78%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08), transparent 55%)`,
        backgroundColor: SURFACE,
        color: '#ffffff',
        fontFamily: 'Phudu',
        padding: '64px 72px',
        justifyContent: 'space-between',
      },
    },
    // ─── Top row: Oxy mark + product badge ───
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        },
      },
      createElement(
        'div',
        {
          style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 },
        },
        createElement('img', {
          src: props.oxyMarkDataUrl,
          width: 64,
          height: 35,
          style: { display: 'block' },
        }),
        createElement(
          'span',
          {
            style: {
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#ffffff',
            },
          },
          'Oxy',
        ),
      ),
      props.productLogoDataUrl
        ? createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 999,
                padding: '8px 18px 8px 10px',
              },
            },
            createElement('img', {
              src: props.productLogoDataUrl,
              width: 32,
              height: 32,
              style: { display: 'block', borderRadius: 8 },
            }),
            createElement(
              'span',
              { style: { fontSize: 20, color: '#ffffff', fontWeight: 500 } },
              props.categoryLabel,
            ),
          )
        : createElement('div', { style: { display: 'flex' } }),
    ),
    // ─── Title band ───
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '92%',
        },
      },
      createElement(
        'div',
        {
          style: {
            fontSize: titleFontSize,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            // Satori clamps long words; this gives some breathing room.
            display: 'block',
          },
        },
        props.title,
      ),
    ),
    // ─── Bottom row: category chip + "Oxy Help" mark ───
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        },
      },
      createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 999,
            padding: '8px 18px',
          },
        },
        createElement('div', {
          style: {
            display: 'flex',
            width: 8,
            height: 8,
            borderRadius: 999,
            background: '#ffffff',
            opacity: 0.85,
          },
        }),
        createElement(
          'span',
          { style: { fontSize: 18, color: 'rgba(255,255,255,0.92)', fontWeight: 500 } },
          props.categoryLabel,
        ),
      ),
      createElement(
        'span',
        {
          style: {
            fontSize: 18,
            color: 'rgba(255,255,255,0.72)',
            fontWeight: 500,
            letterSpacing: '0.02em',
          },
        },
        'Oxy Help',
      ),
    ),
  )
}

/* ─── Render ─── */

async function renderCardPng(meta: ArticleMeta, assets: BrandAssets): Promise<Buffer> {
  const categoryLabel = CATEGORY_LABEL[meta.category] ?? meta.category
  const svg = await satori(
    buildCard({
      title: meta.title,
      category: meta.category,
      categoryLabel,
      productLogoDataUrl: assets.productLogos[meta.category],
      oxyMarkDataUrl: assets.oxyMarkDataUrl,
    }),
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: [
        { name: 'Phudu', data: assets.titleFont, weight: 700, style: 'normal' },
        { name: 'Phudu', data: assets.bodyFont, weight: 400, style: 'normal' },
      ],
    },
  )
  // Resvg is deterministic given the same SVG input and disabling system
  // fonts (we embed everything ourselves). That keeps committed PNGs stable
  // across machines so CI diffs only when content actually changes.
  const resvg = new Resvg(svg, {
    font: { loadSystemFonts: false },
    fitTo: { mode: 'width', value: CARD_WIDTH },
  })
  return resvg.render().asPng()
}

/* ─── Orchestration ─── */

interface BuildResult {
  generated: number
  skipped: number
}

async function main(): Promise<BuildResult> {
  if (!existsSync(HELP_DIR)) {
    throw new Error(`[help-og] help content directory missing: ${HELP_DIR}`)
  }
  const relativePaths = await walkHelpDir(HELP_DIR, HELP_DIR)
  if (relativePaths.length === 0) {
    console.warn(`[help-og] no .mdx files under ${HELP_DIR} — nothing to do`)
    return { generated: 0, skipped: 0 }
  }
  const assets = await loadAssets()
  await mkdir(OUTPUT_DIR, { recursive: true })

  let generated = 0
  let skipped = 0
  const seenSlugs = new Set<string>()
  for (const rel of relativePaths.sort()) {
    const absPath = path.join(HELP_DIR, rel)
    const meta = await loadArticleMeta(absPath)
    // English is the default locale and the canonical OG image; we don't
    // need a per-locale variant because the URL is the same (only the
    // localized title would change, and current help articles are short
    // enough that the EN headline is usually the recognizable one).
    if (meta.locale !== 'en') continue
    if (seenSlugs.has(meta.slug)) continue
    seenSlugs.add(meta.slug)
    if (meta.coverImage) {
      skipped++
      continue
    }
    const outPath = path.join(OUTPUT_DIR, `${meta.slug}.png`)
    await mkdir(path.dirname(outPath), { recursive: true })
    const png = await renderCardPng(meta, assets)
    await writeFile(outPath, png)
    generated++
    console.log(`[help-og] ${meta.slug}.png (${png.byteLength} B)`)
  }

  return { generated, skipped }
}

const t0 = performance.now()
const { generated, skipped } = await main()
const elapsedMs = Math.round(performance.now() - t0)
console.log(
  `[help-og] done — ${generated} generated, ${skipped} skipped (author-set), in ${elapsedMs}ms`,
)
