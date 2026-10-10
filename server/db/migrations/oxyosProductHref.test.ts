import { beforeAll, beforeEach, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { sql } from 'drizzle-orm'
import { db } from '../postgres.js'
import { products } from '../schema/index.js'
import { ensureApp } from '../../test/app.js'
import { resetDatabase } from '../../test/helpers.js'

const migration = readFileSync(new URL('./0026_oxyos_product_href.sql', import.meta.url), 'utf8')
const applyMigration = () => db.execute(sql.raw(migration))
const fixture = (productId: string, overrides: Partial<typeof products.$inferInsert> = {}) => ({
  productId,
  name: 'Oxy OS',
  href: 'https://os.oxy.so',
  brand: '#f97316',
  mark: 'X',
  updatedAt: new Date(Date.now() - 60_000),
  ...overrides,
})

beforeAll(ensureApp)
beforeEach(resetDatabase)

test('repoints the Oxy OS product from os.oxy.so to oxy.so/os and nothing else', async () => {
  const [oxyos, unrelated] = await db.insert(products).values([
    fixture('oxyos', { description: 'Historical CMS copy', showInNav: true }),
    // Another product that happens to share the retired host keeps its row.
    fixture('unrelated', { href: 'https://os.oxy.so/elsewhere' }),
  ]).returning()

  await applyMigration()
  const rows = await db.select().from(products)
  expect(rows).toHaveLength(2)
  expect(rows.find(row => row.productId === 'unrelated')).toEqual(unrelated)
  const repointed = rows.find(row => row.productId === 'oxyos')!
  expect(repointed).toEqual({ ...oxyos, href: 'https://oxy.so/os', updatedAt: repointed.updatedAt })
  expect(repointed.updatedAt.getTime()).toBeGreaterThan(oxyos.updatedAt.getTime())

  await applyMigration()
  expect(await db.select().from(products)).toEqual(rows)
})

test('matches every spelling of the retired host', async () => {
  for (const href of ['https://os.oxy.so/', 'http://os.oxy.so', 'HTTPS://OS.OXY.SO/downloads']) {
    await resetDatabase()
    await db.insert(products).values(fixture('oxyos', { href }))
    await applyMigration()
    const [row] = await db.select().from(products)
    expect(row?.href).toBe('https://oxy.so/os')
  }
})

test('keeps an Oxy OS link that no longer names the retired host', async () => {
  for (const href of ['/os', 'https://oxy.so/os', 'https://pos.oxy.so', 'https://os.oxy.so.example.com']) {
    await resetDatabase()
    const rows = await db.insert(products).values(fixture('oxyos', { href })).returning()
    await applyMigration()
    expect(await db.select().from(products)).toEqual(rows)
  }
})
