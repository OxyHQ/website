import { describe, expect, test } from 'bun:test'
import { slugBase, slugify } from './slugs.js'

describe('slugify', () => {
  test('folds diacritics and punctuation into single dashes', () => {
    expect(slugify('Diseñador sénior — Barcelona')).toBe('disenador-senior-barcelona')
    expect(slugify('  Straße & Øresund  ')).toBe('strasse-oresund')
  })

  test('text with no Latin letters or digits yields an empty slug', () => {
    expect(slugify('山田太郎')).toBe('')
    expect(slugify('—')).toBe('')
  })

  test('long titles are cut without a trailing dash', () => {
    const slug = slugify(`${'word '.repeat(40)}end`)
    expect(slug.length).toBeLessThanOrEqual(120)
    expect(slug.endsWith('-')).toBe(false)
  })

  test('slugBase falls back to a prefixed id', () => {
    expect(slugBase('Привет', 'member')).toMatch(/^member-[0-9a-f]{8}$/)
    expect(slugBase('Hello', 'member')).toBe('hello')
  })
})
