import { beforeAll, beforeEach, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { sql } from 'drizzle-orm'
import { db } from '../postgres.js'
import { products } from '../schema/index.js'
import { ensureApp } from '../../test/app.js'
import { resetDatabase } from '../../test/helpers.js'

const migration = readFileSync(new URL('./0030_alia_health_url.sql', import.meta.url), 'utf8')
const applyMigration = () => db.execute(sql.raw(migration))
const fixture = (productId: string, overrides: Partial<typeof products.$inferInsert> = {}) => ({
  productId,
  name: 'Alia',
  href: 'https://alia.onl/',
  healthUrl: 'https://api.alia.onl/health/ready',
  brand: '#7c3aed',
  mark: 'A',
  updatedAt: new Date(Date.now() - 60_000),
  ...overrides,
})

beforeAll(ensureApp)
beforeEach(resetDatabase)

test("repoints Alia's health from the retiring api.alia.onl to api.gemies.ai and nothing else", async () => {
  const [alia, unrelated] = await db.insert(products).values([
    fixture('alia', { description: 'Historical CMS copy' }),
    // Another row naming the retired host is not Alia's to change.
    fixture('unrelated'),
  ]).returning()

  await applyMigration()
  const rows = await db.select().from(products)
  expect(rows).toHaveLength(2)
  expect(rows.find(row => row.productId === 'unrelated')).toEqual(unrelated)
  const repointed = rows.find(row => row.productId === 'alia')!
  expect(repointed).toEqual({
    ...alia,
    healthUrl: 'https://api.gemies.ai/health/ready',
    updatedAt: repointed.updatedAt,
  })
  expect(repointed.updatedAt.getTime()).toBeGreaterThan(alia.updatedAt.getTime())

  await applyMigration()
  expect(await db.select().from(products)).toEqual(rows)
})

test('keeps a health URL an editor has set since', async () => {
  const [edited] = await db.insert(products).values(
    fixture('alia', { healthUrl: 'https://status.example/alia' }),
  ).returning()
  await applyMigration()
  expect(await db.select().from(products)).toEqual([edited])
})
