import { describe, expect, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import {
  PROHIBITED_UNQUALIFIED_TERMS,
  SCOPE_QUALIFIERS,
  approvedClaims,
  claims,
} from '../src/data/ai/claims'
import { RETIRED_MODEL_ALIASES } from '../src/data/ai/taxonomy'

const ROOT = path.resolve(import.meta.dir, '..')

/**
 * Files that DECLARE the vocabulary rather than publish copy.
 *
 * `claims.ts` holds the prohibited-term list and the registry entries;
 * `taxonomy.ts` holds the retired aliases so everything else can check against
 * them. Scanning either for the strings it exists to name finds only itself.
 * Their content is checked by the registry tests above instead.
 */
const VOCABULARY_FILES = ['claims.ts', 'taxonomy.ts']

/**
 * The English copy the AI pages actually render.
 *
 * Deliberately the `src/data/ai/**` modules plus the `ai` namespace of the
 * canonical English dictionary, and not the whole of `src/`: this checks
 * PUBLISHED CLAIMS, and a prohibited term inside a code comment explaining why
 * it is prohibited is not one.
 */
function copyFiles(): string[] {
  const dataDir = path.join(ROOT, 'src', 'data', 'ai')
  return readdirSync(dataDir)
    .filter((name) => name.endsWith('.ts') && !VOCABULARY_FILES.includes(name))
    .map((name) => path.join(dataDir, name))
}

/** Whether a sentence carrying a prohibited term also carries its scope. */
function isQualified(text: string): boolean {
  const lower = text.toLowerCase()
  return SCOPE_QUALIFIERS.some((qualifier) => lower.includes(qualifier))
}

/** Prohibited terms present in a sentence, ignoring case. */
function prohibitedTermsIn(text: string): string[] {
  const lower = text.toLowerCase()
  return PROHIBITED_UNQUALIFIED_TERMS.filter((term) => lower.includes(term.toLowerCase()))
}

/** String literals from a TypeScript source, with comments removed first. */
function publishedStrings(source: string): string[] {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
  const out: string[] = []
  for (const match of withoutComments.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)) {
    const value = match[1] ?? match[2] ?? ''
    if (value.length > 0) out.push(value.replace(/\\'/g, "'"))
  }
  return out
}

function englishAiCopy(): string[] {
  const en = readFileSync(path.join(ROOT, 'src', 'lib', 'i18n', 'locales', 'en.ts'), 'utf8')
  const start = en.indexOf('  ai: {')
  const end = en.indexOf('\n  // ── Common product card / link surfaces')
  const block = start >= 0 && end > start ? en.slice(start, end) : ''
  return publishedStrings(block)
}

describe('the claims registry is maintained', () => {
  test('every claim has an evidence owner', () => {
    for (const claim of claims) {
      expect(claim.evidenceOwner.trim().length).toBeGreaterThan(0)
    }
  })

  test('every approved claim has an unexpired review date', () => {
    const today = new Date()
    for (const claim of approvedClaims()) {
      const reviewBy = new Date(claim.reviewBy)
      expect(Number.isNaN(reviewBy.getTime())).toBe(false)
      // A trust claim past its review date is one nobody has re-checked. The
      // build failing is the mechanism that makes someone look.
      expect(reviewBy.getTime()).toBeGreaterThan(today.getTime())
    }
  })

  test('every claim names at least one surface it appears on', () => {
    for (const claim of claims) {
      expect(claim.surfaces.length).toBeGreaterThan(0)
    }
  })

  test('claim ids are unique', () => {
    const ids = claims.map((claim) => claim.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('an approved claim carries its qualifier in the sentence itself', () => {
    const findings: string[] = []
    for (const claim of approvedClaims()) {
      const terms = prohibitedTermsIn(claim.text)
      if (terms.length === 0 || isQualified(claim.text)) continue
      findings.push(`${claim.id}: ${terms.join(', ')}`)
    }
    // "Zero data retention is available WHERE THE ROUTE is contractually
    // zero-retention" is a fact; the same sentence without the clause is a
    // promise about every provider the platform can reach.
    expect(findings).toEqual([])
  })
})

describe('published AI copy avoids unqualified claims', () => {
  const sources: Array<{ file: string; strings: string[] }> = [
    ...copyFiles().map((file) => ({
      file: path.relative(ROOT, file),
      strings: publishedStrings(readFileSync(file, 'utf8')),
    })),
    { file: 'src/lib/i18n/locales/en.ts (ai namespace)', strings: englishAiCopy() },
  ]

  test('the canonical English AI namespace was actually found', () => {
    // A silent zero here would make the whole check pass by reading nothing.
    const namespace = sources.find((source) => source.file.endsWith('(ai namespace)'))
    expect(namespace?.strings.length ?? 0).toBeGreaterThan(50)
  })

  test('no prohibited term appears without a scope qualifier beside it', () => {
    const findings: string[] = []
    for (const { file, strings } of sources) {
      for (const value of strings) {
        if (isQualified(value)) continue
        for (const term of prohibitedTermsIn(value)) {
          findings.push(`${file}: "${term}" in "${value.slice(0, 120)}"`)
        }
      }
    }
    expect(findings).toEqual([])
  })

  test('no retired Alia alias is presented as a model', () => {
    const findings: string[] = []
    for (const { file, strings } of sources) {
      for (const value of strings) {
        for (const alias of RETIRED_MODEL_ALIASES) {
          if (value.includes(alias)) findings.push(`${file}: "${alias}" in "${value.slice(0, 80)}"`)
        }
      }
    }
    expect(findings).toEqual([])
  })
})
