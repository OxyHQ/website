#!/usr/bin/env bun
/**
 * build-faircoin-og.ts — render the FairCoin Open Graph share image.
 *
 * Produces a single 1200×630 brand card at
 *
 *   public/og-faircoin.png
 *
 * used as the `og:image` / `twitter:image` for FairCoin surfaces
 * (fairco.in apex routes and oxy.so/faircoin/*). Built the same way as the
 * help-article cards in `build-help-og-images.ts`: satori (React → SVG) +
 * @resvg/resvg-js (SVG → PNG), with fonts read straight off disk. No headless
 * browser, deterministic bytes for the same inputs so the committed PNG stays
 * stable across machines.
 *
 * Brand: FairCoin. The palette mirrors Bloom's `faircoin` color preset (see
 * `src/styles/faircoin-theme.css`) — a near-black olive background with the
 * bright FairCoin green accent. Phudu is the FairCoin display typeface.
 *
 * Run manually: `bun scripts/build-faircoin-og.ts`
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { createElement, type ReactElement } from 'react'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..')
const FONTS_DIR = path.join(WEBSITE_ROOT, 'public', 'fonts')
const OUTPUT_PATH = path.join(WEBSITE_ROOT, 'public', 'og-faircoin.png')

const CARD_WIDTH = 1200
const CARD_HEIGHT = 630

/* ─── Brand palette ───
 *
 * Sourced from the FairCoin dark theme in `src/styles/faircoin-theme.css`
 * (Bloom's `faircoin` preset). satori can't resolve CSS custom properties, so
 * the relevant HSL tokens are resolved to hex here:
 *   --color-primary    hsl(92 96% 65%)  → bright FairCoin green
 *   --color-background hsl(69 54% 8%)   → near-black olive
 *   --color-sidebar    hsl(69 40% 6%)   → deepest surface
 */

/** Bright FairCoin green — Bloom `faircoin` preset accent. */
const ACCENT = '#9ffb50'
/** Near-black olive background (FairCoin dark `--background`). */
const SURFACE = '#1c1f09'
/** Deepest FairCoin surface, used for the gradient floor + coin shadow. */
const SURFACE_DEEP = '#0e1006'

const TITLE = 'FairCoin'
const TAGLINE = 'community run cryptocurrency'
/** Footer eyebrow. Plain words only — no separators. */
const FOOTER_LEFT = 'fairco.in'
const FOOTER_RIGHT = 'Free and open since 2014'

interface BrandAssets {
  /** TTF bytes for the display face (Phudu Bold). */
  titleFont: Buffer
  /** TTF bytes for the body face (Phudu Regular). */
  bodyFont: Buffer
  /** Data-URL for the FairCoin coin mark. */
  coinDataUrl: string
}

async function loadFontBytes(): Promise<{ title: Buffer; body: Buffer }> {
  const bold = path.join(FONTS_DIR, 'phudu', 'Phudu-Bold.ttf')
  const regular = path.join(FONTS_DIR, 'phudu', 'Phudu-Regular.ttf')
  if (!existsSync(bold) || !existsSync(regular)) {
    throw new Error(`[faircoin-og] missing Phudu font files in ${FONTS_DIR}/phudu/`)
  }
  const [titleFont, bodyFont] = await Promise.all([readFile(bold), readFile(regular)])
  return { title: titleFont, body: bodyFont }
}

/**
 * The FairCoin coin mark as an inline SVG data URL. Same letterform geometry
 * as `public/favicon-faircoin.svg` (a circle with a stylised "F"), recoloured
 * to the bright preset green so it reads as the accent on the dark card rather
 * than the duller favicon green. The "F" is punched dark so the coin looks
 * minted rather than flat. satori rasterises this as an `<img>`.
 */
function buildCoinDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="${ACCENT}"/><path fill="${SURFACE}" d="M11 8h11v4.6h-6.4v3.5H21v4.6h-5.4V24H11z"/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

async function loadAssets(): Promise<BrandAssets> {
  const { title, body } = await loadFontBytes()
  return {
    titleFont: title,
    bodyFont: body,
    coinDataUrl: buildCoinDataUrl(),
  }
}

/* ─── Card layout (React element tree, no JSX) ─── */

function buildCard(assets: BrandAssets): ReactElement {
  return createElement(
    'div',
    {
      style: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        // Dark olive surface with a soft green spotlight bleeding from the
        // upper-right, fading to the deepest surface in the lower-left. Keeps
        // the card premium without competing with the wordmark.
        backgroundImage: `radial-gradient(circle at 82% 16%, rgba(159,251,80,0.20), transparent 52%), linear-gradient(160deg, ${SURFACE} 0%, ${SURFACE} 46%, ${SURFACE_DEEP} 100%)`,
        backgroundColor: SURFACE,
        color: '#ffffff',
        fontFamily: 'Phudu',
        padding: '72px 80px',
        justifyContent: 'space-between',
      },
    },
    // ─── Top row: coin mark + accent rule ───
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 22,
        },
      },
      createElement('img', {
        src: assets.coinDataUrl,
        width: 76,
        height: 76,
        style: { display: 'block' },
      }),
      createElement('div', {
        style: {
          display: 'flex',
          width: 64,
          height: 4,
          borderRadius: 999,
          background: ACCENT,
          opacity: 0.85,
        },
      }),
    ),
    // ─── Wordmark + tagline ───
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
        },
      },
      createElement(
        'div',
        {
          style: {
            fontSize: 196,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            // Tint the wordmark toward the accent so the brand colour reads
            // even at a glance, while staying bright enough for contrast.
            color: '#ffffff',
            display: 'block',
          },
        },
        TITLE,
      ),
      createElement(
        'div',
        {
          style: {
            marginTop: 28,
            fontSize: 40,
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: '0.01em',
            color: ACCENT,
            display: 'block',
          },
        },
        TAGLINE,
      ),
    ),
    // ─── Footer row: domain + provenance ───
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
            gap: 12,
            background: 'rgba(159,251,80,0.12)',
            border: '1px solid rgba(159,251,80,0.30)',
            borderRadius: 999,
            padding: '10px 22px',
          },
        },
        createElement('div', {
          style: {
            display: 'flex',
            width: 9,
            height: 9,
            borderRadius: 999,
            background: ACCENT,
          },
        }),
        createElement(
          'span',
          { style: { fontSize: 22, color: ACCENT, fontWeight: 500 } },
          FOOTER_LEFT,
        ),
      ),
      createElement(
        'span',
        {
          style: {
            fontSize: 22,
            color: 'rgba(255,255,255,0.62)',
            fontWeight: 400,
            letterSpacing: '0.02em',
          },
        },
        FOOTER_RIGHT,
      ),
    ),
  )
}

/* ─── Render ─── */

async function renderCardPng(assets: BrandAssets): Promise<Buffer> {
  const svg = await satori(buildCard(assets), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [
      { name: 'Phudu', data: assets.titleFont, weight: 700, style: 'normal' },
      { name: 'Phudu', data: assets.bodyFont, weight: 400, style: 'normal' },
    ],
  })
  // Resvg is deterministic given the same SVG and disabled system fonts (we
  // embed everything ourselves), keeping the committed PNG stable across runs.
  const resvg = new Resvg(svg, {
    font: { loadSystemFonts: false },
    fitTo: { mode: 'width', value: CARD_WIDTH },
  })
  return resvg.render().asPng()
}

async function main(): Promise<void> {
  const assets = await loadAssets()
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  const png = await renderCardPng(assets)
  await writeFile(OUTPUT_PATH, png)
  const relOut = path.relative(WEBSITE_ROOT, OUTPUT_PATH)
  console.log(`[faircoin-og] ${relOut} (${png.byteLength} B, ${CARD_WIDTH}×${CARD_HEIGHT})`)
}

const t0 = performance.now()
await main()
const elapsedMs = Math.round(performance.now() - t0)
console.log(`[faircoin-og] done in ${elapsedMs}ms`)
