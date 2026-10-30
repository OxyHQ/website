import { beforeAll, beforeEach, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { sql } from 'drizzle-orm'
import { db } from '../postgres.js'
import { categories, products } from '../schema/index.js'
import { config } from '../../config.js'
import { ensureApp } from '../../test/app.js'
import { resetDatabase } from '../../test/helpers.js'

const migration = readFileSync(new URL('./0028_stash_atlas_products.sql', import.meta.url), 'utf8')
const applyMigration = () => db.execute(sql.raw(migration))

beforeAll(ensureApp)
beforeEach(resetDatabase)

test('adds Atlas to the directory and the menu, and Stash to the directory alone', async () => {
  const [apps] = await db
    .insert(categories)
    .values({ slug: 'apps', label: 'Apps', scope: 'apps', order: 2 })
    .returning()

  await applyMigration()
  const rows = await db.select().from(products)
  expect(rows).toHaveLength(2)
  expect(rows.find(row => row.productId === 'atlas')).toEqual(expect.objectContaining({
    name: 'Atlas',
    href: 'https://atlas.oxy.so',
    category: apps!._id,
    lifecycle: 'live',
    showOnProducts: true,
    showOnStatus: false,
    showInNav: true,
  }))
  expect(rows.find(row => row.productId === 'stash')).toEqual(expect.objectContaining({
    name: 'Stash',
    category: apps!._id,
    lifecycle: 'in-development',
    showOnProducts: true,
    showOnStatus: false,
    showInNav: false,
  }))

  const nav = await fetch(`http://127.0.0.1:${config.port}/api/products?surface=nav`)
  const navIds = (await nav.json() as Array<{ productId: string }>).map(row => row.productId)
  expect(navIds).toEqual(['atlas'])

  const status = await fetch(`http://127.0.0.1:${config.port}/api/products?surface=status`)
  expect(await status.json()).toEqual([])

  await applyMigration()
  expect(await db.select().from(products)).toEqual(rows)
})

test('keeps a row an editor already made', async () => {
  const [edited] = await db.insert(products).values({
    productId: 'atlas',
    name: 'Atlas',
    tagline: 'Written by an editor',
    href: 'https://atlas.oxy.so',
    brand: '#000000',
    mark: 'A',
    showInNav: false,
  }).returning()

  await applyMigration()
  const rows = await db.select().from(products)
  expect(rows.find(row => row.productId === 'atlas')).toEqual(edited)
  expect(rows.some(row => row.productId === 'stash')).toBe(true)
})

test('files the apps under no category when the category does not exist', async () => {
  await applyMigration()
  const rows = await db.select().from(products)
  expect(rows.map(row => row.category)).toEqual([null, null])
})
