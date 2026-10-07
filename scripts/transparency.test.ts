import { describe, expect, test } from 'bun:test'
import { canonicalTo } from '../src/lib/canonicalPath'
import { LEGAL_DOCUMENTS, TRANSPARENCY_DOCUMENTS, TRANSPARENCY_REDIRECTS, transparencyDestination } from '../src/lib/transparency'
import { hasLocalizedVariants } from '../src/lib/localizedRoute'
import { buildRedirectsFile } from './redirects'
import { articleReadingProgress } from '../src/lib/articleReadingProgress'

const redirects = buildRedirectsFile({ supportedLocales: ['en', 'es'], defaultLocale: 'en', mirroredLocales: ['es'], localeReadinessKnown: true })
  .split('\n').filter((line) => line && !line.startsWith('#')).map((line) => line.trim().split(/\s+/))

describe('transparency document migration', () => {
  test('every old document URL permanently redirects in either slash form, including locale bookmarks', () => {
    for (const [from, to] of TRANSPARENCY_REDIRECTS) {
      for (const prefix of ['', '/en', '/es']) {
        expect(redirects).toContainEqual([`${prefix}${from}`, to, '301'])
        expect(redirects).toContainEqual([`${prefix}${from}/`, to, '301'])
      }
      expect(canonicalTo(`${from}?source=footer#details`)).toBe(`${to}?source=footer#details`)
      expect(canonicalTo({ pathname: from, hash: '#details' })).toEqual({ pathname: to, hash: '#details' })
    }
  })
  test('company marketing routes and unknown documents are not redirected', () => {
    for (const path of ['/company', '/company/team', '/company/careers', '/company/news', '/legal/unknown']) {
      expect(transparencyDestination(path)).toBeUndefined()
      expect(canonicalTo(path)).toBe(`${path}/`)
    }
  })
  test('legal and institutional documents share the collection without untranslated mirrors', () => {
    const paths = [...TRANSPARENCY_DOCUMENTS.map(({ path }) => path), ...LEGAL_DOCUMENTS.map(({ slug }) => `/transparency/legal/${slug}`)]
    expect(new Set(paths).size).toBe(paths.length)
    for (const path of paths) expect(hasLocalizedVariants(path)).toBe(false)
    expect(hasLocalizedVariants('/company')).toBe(true)
  })
})

describe('article-only reading progress', () => {
  test('starts at the article, not at the top of the page', () => {
    expect(articleReadingProgress(800, 2800, 900, 80)).toBe(0)
    expect(articleReadingProgress(80, 2080, 900, 80)).toBe(0)
  })
  test('measures halfway and finishes when the article bottom enters view', () => {
    expect(articleReadingProgress(-510, 1490, 900, 80)).toBe(50)
    expect(articleReadingProgress(-1100, 900, 900, 80)).toBe(100)
    expect(articleReadingProgress(-2000, 0, 900, 80)).toBe(100)
  })
  test('handles short, missing and offscreen bodies', () => {
    expect(articleReadingProgress(100, 400, 900, 80)).toBe(100)
    expect(articleReadingProgress(1000, 1300, 900, 80)).toBe(0)
    expect(articleReadingProgress(0, 0, 900, 80)).toBe(0)
  })
})
