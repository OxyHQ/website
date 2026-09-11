import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sql = readFileSync(
  fileURLToPath(new URL('./0015_public_status_inventory.sql', import.meta.url)),
  'utf8',
)

const aliasBlock = sql.match(/FROM \(VALUES\n([\s\S]+?)\n\) AS aliases\(legacy, canonical\)/)?.[1]
assert.ok(aliasBlock, 'alias mapping must be present')
const aliases = new Map(
  [...aliasBlock.matchAll(/\('([^']+)', '([^']+)'\)/g)].map((match) => [match[1], match[2]]),
)

const inventoryBlock = sql.match(/INSERT INTO "products"[\s\S]+?\nVALUES\n([\s\S]+?)\nON CONFLICT \("product_id"\)/)?.[1]
assert.ok(inventoryBlock, 'canonical inventory must be present')
const canonicalIds = [...inventoryBlock.matchAll(/^\s*\('[a-f0-9]{24}', '([^']+)'/gm)].map((match) => match[1])

interface Product {
  readonly id: string
  readonly name: string
  readonly showOnStatus: boolean
}

function applyMigration(input: ReadonlyMap<string, Product>): Map<string, Product> {
  const rows = new Map(input)
  for (const [legacy, canonical] of aliases) {
    const legacyRow = rows.get(legacy)
    if (legacyRow !== undefined && !rows.has(canonical)) {
      rows.delete(legacy)
      rows.set(canonical, legacyRow)
    }
  }
  for (const legacy of aliases.keys()) {
    const row = rows.get(legacy)
    if (row !== undefined) rows.set(legacy, { ...row, showOnStatus: false })
  }
  for (const canonical of canonicalIds) {
    const existing = rows.get(canonical)
    rows.set(canonical, existing === undefined
      ? { id: `inserted-${canonical}`, name: canonical, showOnStatus: true }
      : { ...existing, showOnStatus: true })
  }
  return rows
}

describe('public status inventory migration', () => {
  test('declares the complete canonical census and guarded forward rename', () => {
    assert.equal(canonicalIds.length, 28)
    assert.equal(new Set(canonicalIds).size, 28)
    assert.ok(canonicalIds.includes('kaana'))
    assert.ok(canonicalIds.includes('nilo'))
    assert.deepEqual(
      [...aliases],
      [
        ['c', 'clarity'],
        ['i', 'inbox'],
        ['fairwallet', 'faircoin-wallet'],
        ['faircoinexplorer', 'faircoin-explorer'],
        ['marketplace', 'mercaria'],
      ],
    )
    assert.match(sql, /WHERE legacy\."product_id" = aliases\.legacy\s+AND NOT EXISTS \(\s+SELECT 1 FROM "products" AS canonical\s+WHERE canonical\."product_id" = aliases\.canonical\s+\);/)
  })

  test('preserves an alias CMS row when it is the only historical row', () => {
    const original = { id: 'legacy-id', name: 'Editor-authored Clarity', showOnStatus: true }
    const migrated = applyMigration(new Map([['c', original]]))
    assert.equal(migrated.has('c'), false)
    assert.deepEqual(migrated.get('clarity'), original)
    assert.equal([...migrated.values()].filter((row) => row.showOnStatus).length, 28)
  })

  test('keeps the canonical CMS row and retires rather than deletes a duplicate alias', () => {
    const legacy = { id: 'legacy-id', name: 'Legacy copy', showOnStatus: true }
    const canonical = { id: 'canonical-id', name: 'Current CMS copy', showOnStatus: true }
    const migrated = applyMigration(new Map([['c', legacy], ['clarity', canonical]]))
    assert.deepEqual(migrated.get('clarity'), canonical)
    assert.deepEqual(migrated.get('c'), { ...legacy, showOnStatus: false })
    assert.equal([...migrated.values()].filter((row) => row.showOnStatus).length, 28)
  })

  test('converges to the same rows when applied repeatedly', () => {
    const initial = new Map<string, Product>([
      ['fairwallet', { id: 'wallet-legacy', name: 'Wallet CMS', showOnStatus: true }],
      ['marketplace', { id: 'market-legacy', name: 'Old market', showOnStatus: true }],
      ['mercaria', { id: 'mercaria-canonical', name: 'Mercaria CMS', showOnStatus: true }],
    ])
    const once = applyMigration(initial)
    assert.deepEqual(applyMigration(once), once)
  })
})
