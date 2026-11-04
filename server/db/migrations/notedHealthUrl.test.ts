import { beforeAll, beforeEach, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { sql } from 'drizzle-orm'
import { db } from '../postgres.js'
import { products } from '../schema/index.js'
import { ensureApp } from '../../test/app.js'
import { resetDatabase } from '../../test/helpers.js'

const migration = readFileSync(new URL('./0029_noted_health_url.sql', import.meta.url), 'utf8')
const applyMigration = () => db.execute(sql.raw(migration))
const fixture = (productId: string, overrides: Partial<typeof products.$inferInsert> = {}) => ({
  productId,
  name: 'Noted',
  href: 'https://noted.oxy.so',
  healthUrl: 'https://api.noted.oxy.so/health/ready',
  brand: '#7c3aed',
  mark: 'N',
  updatedAt: new Date(Date.now() - 60_000),
  ...overrides,
})

beforeAll(ensureApp)
beforeEach(resetDatabase)

test("repoints Noted's health from the retired api.noted.oxy.so to Nilo's readiness and nothing else", async () => {
  const [noted, unrelated] = await db.insert(products).values([
    fixture('noted', { description: 'Historical CMS copy' }),
    // Another row naming the retired host is not Noted's to change.
    fixture('unrelated'),
  ]).returning()

  await applyMigration()
  const rows = await db.select().from(products)
  expect(rows).toHaveLength(2)
  expect(rows.find(row => row.productId === 'unrelated')).toEqual(unrelated)
  const repointed = rows.find(row => row.productId === 'noted')!
  expect(repointed).toEqual({
    ...noted,
    healthUrl: 'https://api.nilo.so/health/ready',
    updatedAt: repointed.updatedAt,
  })
  expect(repointed.updatedAt.getTime()).toBeGreaterThan(noted.updatedAt.getTime())

  await applyMigration()
  expect(await db.select().from(products)).toEqual(rows)
})

test('keeps a health URL an editor has set since', async () => {
  const [edited] = await db.insert(products).values(
    fixture('noted', { healthUrl: 'https://status.example/noted' }),
  ).returning()
  await applyMigration()
  expect(await db.select().from(products)).toEqual([edited])
})
