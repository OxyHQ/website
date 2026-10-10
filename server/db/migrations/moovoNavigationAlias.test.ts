import { beforeAll, beforeEach, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { sql } from 'drizzle-orm'
import { db } from '../postgres.js'
import { products } from '../schema/index.js'
import { config } from '../../config.js'
import { ensureApp } from '../../test/app.js'
import { resetDatabase } from '../../test/helpers.js'

const migration = readFileSync(new URL('./0025_moovo_navigation_alias.sql', import.meta.url), 'utf8')
const applyMigration = () => db.execute(sql.raw(migration))
const fixture = (productId: string, overrides: Partial<typeof products.$inferInsert> = {}) => ({
  productId,
  name: 'Moovo',
  href: productId === 'moovo' ? 'https://moovo.now' : '/moovo',
  brand: '#0d9488',
  mark: 'M',
  updatedAt: new Date(Date.now() - 60_000),
  ...overrides,
})

beforeAll(ensureApp)
beforeEach(resetDatabase)

test('retires only the duplicate Moovo nav entry while preserving records and other surfaces', async () => {
  const [legacy, canonical, unrelated] = await db.insert(products).values([
    fixture('m', { showOnProducts: false, showOnStatus: true, description: 'Historical CMS copy' }),
    fixture('moovo', { tagline: 'Move together', external: true }),
    fixture('unrelated', { href: '/another-product' }),
  ]).returning()

  await applyMigration()
  const rows = await db.select().from(products)
  expect(rows).toHaveLength(3)
  expect(rows.find(row => row.productId === 'moovo')).toEqual(canonical)
  expect(rows.find(row => row.productId === 'unrelated')).toEqual(unrelated)
  const retired = rows.find(row => row.productId === 'm')!
  expect(retired).toEqual({ ...legacy, showInNav: false, updatedAt: retired.updatedAt })
  expect(retired.updatedAt.getTime()).toBeGreaterThan(legacy.updatedAt.getTime())

  const response = await fetch(`http://127.0.0.1:${config.port}/api/products?surface=nav`)
  expect(response.status).toBe(200)
  const nav = await response.json() as Array<{ productId: string; name: string; href: string }>
  expect(nav.filter(row => ['m', 'moovo'].includes(row.productId))).toEqual([
    expect.objectContaining({ productId: 'moovo', name: 'Moovo', href: 'https://moovo.now' }),
  ])
  expect(nav.some(row => row.productId === 'unrelated')).toBe(true)

  await applyMigration()
  expect(await db.select().from(products)).toEqual(rows)
})

test('preserves the legacy entry when no canonical replacement exists', async () => {
  const [legacy] = await db.insert(products).values(fixture('m')).returning()
  await applyMigration()
  expect(await db.select().from(products)).toEqual([legacy])
})

test('preserves the legacy entry when the canonical replacement is hidden', async () => {
  const rows = await db.insert(products).values([
    fixture('m'),
    fixture('moovo', { showInNav: false }),
  ]).returning()
  await applyMigration()
  expect(await db.select().from(products)).toEqual(rows)
})
