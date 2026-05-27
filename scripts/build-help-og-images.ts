#!/usr/bin/env bun
/**
 * build-help-og-images.ts — pre-render OG/card images for help articles.
 *
 * Walks every `src/content/help/**.mdx` file, reads its YAML frontmatter,
 * and renders a 1200×630 brand-consistent card per `{ slug, locale }` pair to
 *
 *   public/images/help-og/<slug>.png            (default locale `en`)
 *   public/images/help-og/<locale>/<slug>.png   (every other locale)
 *
 * using satori (React → SVG) + @resvg/resvg-js (SVG → PNG). No headless
 * browser, ~50ms per image.
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
 * Default locale used when an MDX file has no `.{locale}` suffix. Mirrors
 * `DEFAULT_LOCALE` in `src/content/schemas.ts` so the script and the loader
 * agree on the unprefixed (canonical) URL slot.
 */
const DEFAULT_LOCALE = 'en'

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
    return {
      slug: cleaned.replace(LOCALE_SUFFIX_RE, ''),
      locale: match[1] ?? DEFAULT_LOCALE,
    }
  }
  return { slug: cleaned.replace(/\.mdx$/, ''), locale: DEFAULT_LOCALE }
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
 * Human-readable labels per locale, mirroring HELP_CATEGORIES in the loader
 * (`src/content/help-loader.ts`) and the help UI's category chips. Duplicated
 * here intentionally — the loader is Vite-context (eager glob) and importing
 * it would drag the entire help index into this small build script.
 *
 * Falls back to the English label when a locale is missing a translation, so
 * adding more locales over time is additive and safe.
 *
 * NOTE: the i18n locale dictionaries don't yet expose these category labels
 * (only the help-center surface chrome lives in `src/lib/i18n/locales/*.ts`).
 * When that gap is closed we should source these from there instead.
 */
type HelpCategoryId = 'account' | 'inbox' | 'auth' | 'console' | 'getting-started'

const CATEGORY_LABELS: Record<string, Partial<Record<HelpCategoryId, string>>> = {
  en: {
    account: 'Account',
    inbox: 'Inbox',
    auth: 'Auth & sign-in',
    console: 'Console',
    'getting-started': 'Getting started',
  },
  es: {
    account: 'Cuenta',
    inbox: 'Bandeja de entrada',
    auth: 'Inicio de sesión',
    console: 'Consola',
    'getting-started': 'Primeros pasos',
  },
  fr: {
    account: 'Compte',
    inbox: 'Boîte de réception',
    auth: 'Connexion',
    console: 'Console',
    'getting-started': 'Premiers pas',
  },
  de: {
    account: 'Konto',
    inbox: 'Posteingang',
    auth: 'Anmeldung',
    console: 'Konsole',
    'getting-started': 'Erste Schritte',
  },
  it: {
    account: 'Account',
    inbox: 'Posta in arrivo',
    auth: 'Accesso',
    console: 'Console',
    'getting-started': 'Per iniziare',
  },
  pt: {
    account: 'Conta',
    inbox: 'Caixa de entrada',
    auth: 'Início de sessão',
    console: 'Console',
    'getting-started': 'Primeiros passos',
  },
  ca: {
    account: 'Compte',
    inbox: 'Safata d’entrada',
    auth: 'Inici de sessió',
    console: 'Consola',
    'getting-started': 'Primers passos',
  },
  ja: {
    account: 'アカウント',
    inbox: '受信トレイ',
    auth: 'サインイン',
    console: 'コンソール',
    'getting-started': 'はじめに',
  },
  ko: {
    account: '계정',
    inbox: '받은편지함',
    auth: '로그인',
    console: '콘솔',
    'getting-started': '시작하기',
  },
  zh: {
    account: '账户',
    inbox: '收件箱',
    auth: '登录',
    console: '控制台',
    'getting-started': '快速入门',
  },
  ar: {
    account: 'الحساب',
    inbox: 'البريد الوارد',
    auth: 'تسجيل الدخول',
    console: 'وحدة التحكم',
    'getting-started': 'البدء',
  },
}

function categoryLabelFor(category: string, locale: string): string {
  const localized = CATEGORY_LABELS[locale]?.[category as HelpCategoryId]
  if (localized) return localized
  const fallback = CATEGORY_LABELS[DEFAULT_LOCALE]?.[category as HelpCategoryId]
  if (fallback) return fallback
  return category
}

/**
 * Localized "Help" label rendered next to the Oxy lockup bottom-right.
 * Mirrors the marketing-site /help heading. Falls back to English.
 */
const HELP_LABELS: Record<string, string> = {
  en: 'Help',
  es: 'Ayuda',
  fr: 'Aide',
  de: 'Hilfe',
  it: 'Guida',
  pt: 'Ajuda',
  ca: 'Ajuda',
  ja: 'ヘルプ',
  ko: '도움말',
  zh: '帮助',
  ar: 'المساعدة',
}

function helpLabelFor(locale: string): string {
  return HELP_LABELS[locale] ?? HELP_LABELS[DEFAULT_LOCALE] ?? 'Help'
}

interface BrandAssets {
  /** TTF bytes for the title font (Phudu Bold — Oxy display face). */
  titleFont: Buffer
  /** TTF bytes for the body/label font (Phudu Regular). */
  bodyFont: Buffer
  /** Data-URL for the full Oxy brand lockup (mark + OXY wordmark). */
  oxyLockupDataUrl: string
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
 * Inline the full Oxy brand lockup as an `<img>` data URL. Mirrors the
 * canonical `<Logo>` component in `src/components/ui/Logo.tsx` — the same
 * SVG geometry the navbar / footer render at runtime, including both the
 * mark and the "OXY" wordmark letterforms layered on top.
 *
 * All fills are forced to white so the lockup reads cleanly on the dark
 * purple gradient background (satori can't resolve CSS custom properties
 * like `var(--color-primary)`).
 */
function buildOxyLockupDataUrl(): string {
  // Source: src/components/ui/Logo.tsx. Two layered <g> blocks — first the
  // four mark paths (originally fill="var(--color-primary)"), then three
  // white OXY letterforms positioned on top via translate(10.316 2.495).
  // Forcing both groups to white gives a single monochrome lockup that sits
  // cleanly on the dark gradient.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 41 22"><g fill="#ffffff"><path d="M 9.492 0.03 C 8.39 0.157 7.368 0.958 6.758 2.163 C 6.451 2.772 6.247 3.55 6.205 4.266 L 6.186 4.615 L 5.908 4.472 C 5.119 4.068 4.411 3.892 3.561 3.889 C 2.811 3.885 2.281 3.999 1.722 4.279 C 0.869 4.709 0.329 5.377 0.084 6.298 C -0.007 6.64 -0.016 7.376 0.064 7.747 C 0.252 8.588 0.669 9.359 1.292 10.014 C 1.603 10.336 2.107 10.75 2.378 10.903 C 2.449 10.945 2.511 10.987 2.511 10.997 C 2.511 11.007 2.453 11.049 2.382 11.092 C 2.104 11.251 1.606 11.662 1.299 11.984 C -0.055 13.401 -0.388 15.283 0.478 16.621 C 0.963 17.37 1.729 17.859 2.721 18.054 C 3.119 18.132 3.93 18.132 4.366 18.054 C 4.903 17.956 5.394 17.79 5.901 17.533 L 6.195 17.383 L 6.195 17.572 C 6.195 18.008 6.305 18.63 6.473 19.142 C 7.146 21.193 8.878 22.346 10.604 21.893 C 11.405 21.682 12.171 21.092 12.691 20.281 C 13.137 19.584 13.438 18.627 13.49 17.735 L 13.509 17.39 L 13.797 17.536 C 14.611 17.947 15.306 18.116 16.182 18.113 C 17 18.109 17.597 17.956 18.234 17.582 C 18.567 17.386 19.055 16.901 19.249 16.575 C 19.566 16.045 19.679 15.621 19.682 14.973 C 19.685 14.309 19.595 13.922 19.284 13.257 C 18.91 12.459 18.176 11.636 17.404 11.154 C 17.284 11.079 17.184 11.01 17.184 11.001 C 17.184 10.991 17.284 10.922 17.404 10.848 C 17.95 10.506 18.59 9.88 18.945 9.34 C 19.52 8.47 19.779 7.532 19.676 6.683 C 19.501 5.266 18.499 4.25 16.974 3.947 C 16.544 3.859 15.733 3.866 15.261 3.96 C 14.769 4.058 14.362 4.195 13.897 4.423 L 13.499 4.615 L 13.499 4.429 C 13.499 3.511 13.124 2.335 12.591 1.573 C 11.964 0.684 11.124 0.15 10.158 0.027 C 9.87 -0.009 9.838 -0.009 9.492 0.03 Z"/><path d="M 6.878 18.362 C 5.764 18.442 4.76 18.222 3.866 17.701 C 3.044 17.222 2.351 16.559 1.786 15.711 C 1.268 14.933 0.862 14.032 0.568 13.006 C 0.289 12.034 0.111 11.008 0.035 9.929 C -0.037 8.913 0.002 7.878 0.15 6.823 C 0.305 5.723 0.594 4.713 1.017 3.791 C 1.47 2.803 2.08 1.971 2.848 1.296 C 3.716 0.531 4.768 0.105 6.002 0.016 C 7.228 -0.072 8.299 0.202 9.216 0.837 C 10.027 1.398 10.69 2.143 11.204 3.07 C 11.667 3.905 12.022 4.841 12.267 5.879 C 12.498 6.855 12.648 7.837 12.718 8.825 C 12.798 9.948 12.761 11.023 12.609 12.05 C 12.449 13.131 12.153 14.105 11.721 14.973 C 11.253 15.912 10.629 16.68 9.848 17.278 C 9.01 17.918 8.02 18.28 6.878 18.362 Z" transform="translate(8.662 1.432)"/><path d="M 13.564 2.803 C 13.561 3.26 13.48 3.731 13.322 4.216 C 13.196 4.606 13.039 4.997 12.852 5.389 C 12.682 5.749 12.498 6.102 12.302 6.448 C 12.142 6.73 11.98 7.011 11.816 7.292 L 10.391 6.446 L 11.846 7.239 L 10.953 8.902 C 10.638 9.492 10.306 10.073 9.958 10.643 L 8.548 9.771 L 9.979 8.933 C 10.153 9.236 10.375 9.642 10.643 10.152 C 10.917 10.672 11.183 11.218 11.442 11.79 C 11.707 12.376 11.938 12.95 12.136 13.511 C 12.382 14.211 12.503 14.826 12.5 15.355 C 12.495 15.933 12.337 16.468 12.024 16.962 C 11.79 17.331 11.485 17.611 11.106 17.804 C 10.759 17.981 10.378 18.068 9.964 18.065 C 9.226 18.06 8.531 17.785 7.879 17.239 C 7.438 16.87 7.026 16.438 6.642 15.942 C 6.296 15.494 5.979 15.036 5.689 14.566 C 5.424 14.135 5.212 13.786 5.055 13.517 L 6.479 12.669 L 7.781 13.698 C 7.551 13.993 7.316 14.284 7.076 14.57 C 6.862 14.825 6.653 15.084 6.448 15.347 L 5.925 16.005 C 5.689 16.3 5.432 16.588 5.155 16.871 C 4.836 17.197 4.502 17.475 4.154 17.705 C 3.625 18.055 3.079 18.228 2.515 18.224 C 2.023 18.221 1.587 18.093 1.207 17.841 C 0.889 17.631 0.631 17.359 0.432 17.026 C 0.269 16.753 0.153 16.458 0.083 16.138 C 0.026 15.877 -0.002 15.61 0 15.343 C 0.004 14.764 0.103 14.187 0.298 13.613 C 0.463 13.126 0.656 12.671 0.878 12.248 L 2.341 13.026 L 0.849 12.304 C 1.497 10.946 2.175 9.602 2.884 8.275 L 4.341 9.066 L 2.843 9.774 C 2.69 9.445 2.504 9 2.284 8.439 C 2.069 7.889 1.857 7.313 1.65 6.711 C 1.436 6.09 1.252 5.485 1.098 4.896 C 0.918 4.205 0.829 3.619 0.832 3.137 C 0.837 2.447 1.014 1.823 1.363 1.267 C 1.623 0.853 1.969 0.541 2.402 0.332 C 2.779 0.149 3.198 0.059 3.657 0.063 C 4.198 0.067 4.699 0.213 5.16 0.502 C 5.494 0.712 5.796 0.971 6.068 1.28 C 6.299 1.544 6.506 1.829 6.685 2.132 C 6.851 2.412 6.986 2.678 7.092 2.93 L 5.566 3.576 L 7.066 2.871 L 7.707 4.255 C 7.936 4.746 8.151 5.254 8.354 5.781 L 6.81 6.382 L 5.38 5.545 C 5.486 5.361 5.63 5.114 5.814 4.802 C 6.012 4.466 6.236 4.112 6.487 3.738 C 6.736 3.367 7.005 2.99 7.294 2.607 C 7.608 2.191 7.932 1.814 8.266 1.475 C 8.636 1.099 9.018 0.785 9.411 0.533 C 9.974 0.174 10.545 -0.004 11.125 0 C 11.582 0.003 11.995 0.123 12.363 0.359 C 12.727 0.591 13.009 0.912 13.208 1.322 C 13.449 1.816 13.568 2.309 13.564 2.803 Z" transform="translate(18.364 0.865)"/><path d="M 12.373 4.006 C 12.319 4.689 12.176 5.421 11.943 6.204 C 11.727 6.929 11.466 7.657 11.159 8.386 C 10.862 9.096 10.545 9.784 10.21 10.451 C 9.881 11.105 9.577 11.683 9.298 12.185 C 9.157 12.443 8.98 12.774 8.766 13.18 C 8.54 13.612 8.288 14.071 8.012 14.556 C 7.727 15.056 7.43 15.55 7.123 16.036 C 6.783 16.573 6.434 17.054 6.075 17.481 C 5.678 17.953 5.268 18.343 4.847 18.649 C 4.207 19.114 3.539 19.319 2.843 19.265 C 2.372 19.227 1.953 19.094 1.587 18.865 C 1.172 18.606 0.858 18.25 0.644 17.797 C 0.37 17.214 0.258 16.589 0.31 15.922 C 0.351 15.399 0.477 14.865 0.688 14.317 C 0.869 13.848 1.087 13.387 1.342 12.934 C 1.585 12.502 1.85 12.084 2.137 11.68 C 2.4 11.31 2.644 10.978 2.869 10.682 L 4.18 11.699 L 3.655 13.28 C 3.218 13.132 2.808 12.903 2.425 12.592 C 1.973 12.226 1.646 11.789 1.442 11.282 L 1.431 11.256 L 1.421 11.228 C 1.241 10.732 1.06 10.177 0.878 9.564 C 0.692 8.938 0.532 8.306 0.397 7.667 C 0.26 7.02 0.153 6.374 0.078 5.73 C -0.003 5.029 -0.021 4.381 0.025 3.785 C 0.051 3.452 0.113 3.101 0.212 2.73 C 0.326 2.301 0.495 1.904 0.719 1.538 C 0.981 1.11 1.314 0.757 1.716 0.479 C 2.247 0.113 2.853 -0.043 3.534 0.01 C 3.923 0.041 4.287 0.146 4.628 0.324 C 4.953 0.494 5.243 0.725 5.497 1.018 C 5.85 1.423 6.145 1.909 6.382 2.475 C 6.589 2.972 6.756 3.514 6.88 4.102 C 6.992 4.626 7.083 5.142 7.154 5.65 C 7.224 6.149 7.277 6.608 7.314 7.028 C 7.344 7.381 7.374 7.65 7.402 7.836 L 5.767 8.09 L 4.207 7.536 C 4.28 7.326 4.397 7.019 4.557 6.617 C 4.718 6.21 4.908 5.765 5.128 5.28 C 5.353 4.782 5.606 4.275 5.886 3.757 C 6.181 3.214 6.489 2.718 6.81 2.271 C 7.179 1.756 7.573 1.331 7.992 0.995 C 8.632 0.482 9.315 0.254 10.04 0.311 C 10.367 0.337 10.671 0.426 10.952 0.578 C 11.235 0.731 11.478 0.939 11.679 1.201 C 11.928 1.524 12.109 1.889 12.222 2.296 C 12.311 2.616 12.363 2.945 12.378 3.277 C 12.391 3.553 12.389 3.796 12.373 4.006 Z" transform="translate(28.614 0.828)"/></g><g fill="#ffffff" transform="translate(10.316 2.495)"><path d="M 5.106 15.637 C 4.33 15.692 3.641 15.545 3.04 15.195 C 2.439 14.845 1.928 14.353 1.505 13.719 C 1.083 13.086 0.749 12.339 0.502 11.48 C 0.256 10.621 0.099 9.71 0.031 8.748 C -0.033 7.85 0.002 6.932 0.134 5.994 C 0.266 5.056 0.509 4.201 0.864 3.427 C 1.219 2.654 1.691 2.007 2.281 1.488 C 2.872 0.968 3.6 0.678 4.466 0.615 C 5.306 0.555 6.026 0.733 6.625 1.148 C 7.224 1.562 7.717 2.12 8.106 2.82 C 8.495 3.521 8.794 4.315 9.004 5.202 C 9.214 6.09 9.351 6.983 9.414 7.881 C 9.485 8.881 9.453 9.834 9.319 10.74 C 9.184 11.646 8.941 12.454 8.588 13.162 C 8.235 13.871 7.77 14.446 7.194 14.887 C 6.617 15.328 5.921 15.578 5.106 15.637 Z M 4.576 4.882 C 4.334 4.9 4.134 5.011 3.975 5.216 C 3.817 5.42 3.692 5.684 3.6 6.006 C 3.508 6.329 3.45 6.688 3.427 7.083 C 3.403 7.478 3.406 7.874 3.434 8.272 C 3.466 8.722 3.526 9.17 3.615 9.612 C 3.704 10.057 3.818 10.455 3.958 10.806 C 4.098 11.157 4.262 11.436 4.449 11.641 C 4.637 11.847 4.852 11.941 5.094 11.924 C 5.373 11.904 5.586 11.747 5.731 11.453 C 5.877 11.159 5.983 10.809 6.051 10.405 C 6.118 10 6.153 9.585 6.155 9.159 C 6.157 8.734 6.148 8.38 6.128 8.097 C 6.103 7.751 6.055 7.387 5.983 7.005 C 5.911 6.624 5.813 6.273 5.688 5.953 C 5.563 5.633 5.41 5.37 5.229 5.164 C 5.048 4.958 4.83 4.864 4.576 4.882 Z"/><path d="M 19.958 1.162 C 19.956 1.445 19.902 1.747 19.798 2.068 C 19.694 2.388 19.564 2.712 19.408 3.039 C 19.254 3.362 19.089 3.68 18.913 3.991 C 18.757 4.267 18.599 4.542 18.439 4.816 C 18.14 5.37 17.843 5.924 17.547 6.479 C 17.246 7.042 16.929 7.596 16.597 8.141 C 16.76 8.425 16.971 8.812 17.23 9.303 C 17.488 9.793 17.74 10.31 17.985 10.852 C 18.23 11.394 18.443 11.923 18.625 12.439 C 18.806 12.954 18.895 13.379 18.893 13.713 C 18.891 13.971 18.819 14.212 18.677 14.436 C 18.536 14.66 18.318 14.771 18.025 14.769 C 17.68 14.766 17.333 14.619 16.984 14.327 C 16.635 14.036 16.306 13.689 15.996 13.288 C 15.686 12.887 15.401 12.477 15.143 12.057 C 14.884 11.637 14.679 11.298 14.527 11.04 C 14.31 11.319 14.088 11.594 13.86 11.865 C 13.634 12.135 13.412 12.41 13.195 12.689 C 13.025 12.904 12.854 13.118 12.683 13.332 C 12.483 13.582 12.264 13.828 12.026 14.071 C 11.789 14.313 11.545 14.517 11.294 14.682 C 11.044 14.848 10.804 14.93 10.574 14.928 C 10.408 14.927 10.271 14.89 10.163 14.819 C 10.055 14.748 9.967 14.654 9.897 14.537 C 9.828 14.421 9.778 14.292 9.748 14.15 C 9.717 14.011 9.701 13.868 9.702 13.725 C 9.705 13.327 9.775 12.925 9.911 12.521 C 10.049 12.117 10.208 11.742 10.389 11.396 C 11.025 10.06 11.692 8.74 12.389 7.436 C 12.25 7.139 12.078 6.726 11.871 6.198 C 11.664 5.669 11.46 5.115 11.26 4.534 C 11.06 3.954 10.889 3.39 10.746 2.842 C 10.602 2.295 10.532 1.854 10.534 1.519 C 10.537 1.146 10.628 0.816 10.809 0.528 C 10.99 0.24 11.285 0.097 11.694 0.1 C 11.923 0.102 12.137 0.165 12.334 0.288 C 12.53 0.412 12.711 0.567 12.876 0.755 C 13.04 0.941 13.186 1.142 13.312 1.356 C 13.439 1.569 13.539 1.766 13.615 1.946 C 13.827 2.408 14.041 2.87 14.256 3.33 C 14.47 3.789 14.671 4.263 14.859 4.753 C 14.962 4.573 15.104 4.33 15.285 4.022 C 15.466 3.715 15.672 3.389 15.905 3.043 C 16.137 2.698 16.388 2.346 16.658 1.988 C 16.929 1.63 17.206 1.307 17.488 1.02 C 17.771 0.732 18.057 0.496 18.346 0.312 C 18.634 0.127 18.906 0.035 19.161 0.037 C 19.442 0.039 19.646 0.169 19.771 0.428 C 19.897 0.686 19.959 0.931 19.958 1.162 Z"/><path d="M 29.021 2.208 C 28.977 2.772 28.855 3.388 28.656 4.057 C 28.457 4.724 28.216 5.396 27.933 6.07 C 27.651 6.744 27.35 7.398 27.032 8.031 C 26.713 8.664 26.42 9.221 26.153 9.703 C 26.003 9.975 25.82 10.318 25.602 10.733 C 25.384 11.148 25.142 11.59 24.874 12.06 C 24.602 12.537 24.319 13.009 24.025 13.473 C 23.725 13.946 23.421 14.367 23.11 14.735 C 22.8 15.104 22.489 15.402 22.177 15.629 C 21.865 15.856 21.563 15.958 21.27 15.935 C 20.863 15.903 20.585 15.73 20.436 15.414 C 20.288 15.099 20.228 14.756 20.257 14.385 C 20.285 14.026 20.375 13.649 20.528 13.255 C 20.68 12.86 20.864 12.472 21.079 12.089 C 21.293 11.708 21.527 11.339 21.779 10.983 C 22.031 10.629 22.264 10.312 22.478 10.032 C 22.228 9.948 21.989 9.812 21.76 9.627 C 21.531 9.441 21.369 9.228 21.272 8.988 C 21.104 8.523 20.933 8 20.761 7.419 C 20.588 6.836 20.438 6.247 20.312 5.652 C 20.186 5.055 20.088 4.46 20.019 3.868 C 19.95 3.276 19.934 2.736 19.973 2.249 C 19.99 2.018 20.035 1.767 20.108 1.495 C 20.18 1.223 20.286 0.973 20.425 0.745 C 20.564 0.518 20.739 0.332 20.949 0.187 C 21.158 0.043 21.41 -0.018 21.703 0.005 C 22.033 0.031 22.316 0.179 22.551 0.449 C 22.786 0.719 22.987 1.054 23.154 1.455 C 23.322 1.854 23.457 2.297 23.56 2.783 C 23.663 3.269 23.748 3.746 23.814 4.216 C 23.88 4.685 23.929 5.115 23.963 5.505 C 23.997 5.894 24.031 6.2 24.064 6.422 C 24.131 6.234 24.239 5.949 24.391 5.567 C 24.542 5.186 24.722 4.765 24.93 4.304 C 25.139 3.843 25.374 3.372 25.636 2.89 C 25.898 2.407 26.168 1.97 26.448 1.58 C 26.728 1.189 27.018 0.873 27.319 0.632 C 27.619 0.392 27.916 0.283 28.209 0.306 C 28.399 0.321 28.553 0.404 28.669 0.555 C 28.786 0.706 28.872 0.88 28.927 1.078 C 28.982 1.277 29.014 1.481 29.023 1.686 C 29.032 1.893 29.032 2.067 29.021 2.208 Z"/></g></svg>`
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
    oxyLockupDataUrl: buildOxyLockupDataUrl(),
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
  /** Translated "Help" word shown next to the Oxy lockup bottom-right. */
  helpLabel: string
  productLogoDataUrl: string | undefined
  /** Data-URL for the full Oxy lockup (mark + OXY wordmark). */
  oxyLockupDataUrl: string
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
    // ─── Top row: full Oxy lockup + product badge ───
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
      // Full Oxy lockup (mark + OXY wordmark). Aspect ratio 41:22 from the
      // canonical viewBox in src/components/ui/Logo.tsx. 132×71 keeps the
      // letterforms crisp at OG card density (1200×630).
      createElement('img', {
        src: props.oxyLockupDataUrl,
        width: 132,
        height: 71,
        style: { display: 'block' },
      }),
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
        `Oxy ${props.helpLabel}`,
      ),
    ),
  )
}

/* ─── Render ─── */

async function renderCardPng(meta: ArticleMeta, assets: BrandAssets): Promise<Buffer> {
  const categoryLabel = categoryLabelFor(meta.category, meta.locale)
  const helpLabel = helpLabelFor(meta.locale)
  const svg = await satori(
    buildCard({
      title: meta.title,
      category: meta.category,
      categoryLabel,
      helpLabel,
      productLogoDataUrl: assets.productLogos[meta.category],
      oxyLockupDataUrl: assets.oxyLockupDataUrl,
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

/**
 * Resolve the output path for an OG card. The default locale's images keep
 * the bare path (`/images/help-og/<slug>.png`) for backwards-compat with
 * existing OG URLs. Every other locale nests under `/<locale>/`.
 */
function outputPathFor(slug: string, locale: string): string {
  const segments =
    locale === DEFAULT_LOCALE ? [OUTPUT_DIR, `${slug}.png`] : [OUTPUT_DIR, locale, `${slug}.png`]
  return path.join(...segments)
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
  // Dedupe by `${locale}:${slug}` so we generate one card per (locale, slug)
  // pair. The walker already returns at most one file per pair (locale is
  // encoded in the filename suffix), so this is belt-and-suspenders against
  // mis-shaped trees.
  const seen = new Set<string>()
  for (const rel of relativePaths.sort()) {
    const absPath = path.join(HELP_DIR, rel)
    const meta = await loadArticleMeta(absPath)
    const key = `${meta.locale}:${meta.slug}`
    if (seen.has(key)) continue
    seen.add(key)
    if (meta.coverImage) {
      skipped++
      continue
    }
    const outPath = outputPathFor(meta.slug, meta.locale)
    await mkdir(path.dirname(outPath), { recursive: true })
    const png = await renderCardPng(meta, assets)
    await writeFile(outPath, png)
    generated++
    const relOut = path.relative(OUTPUT_DIR, outPath)
    console.log(`[help-og] ${relOut} (${png.byteLength} B)`)
  }

  return { generated, skipped }
}

const t0 = performance.now()
const { generated, skipped } = await main()
const elapsedMs = Math.round(performance.now() - t0)
console.log(
  `[help-og] done — ${generated} generated, ${skipped} skipped (author-set), in ${elapsedMs}ms`,
)
