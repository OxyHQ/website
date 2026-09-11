import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const sql = readFileSync(
  fileURLToPath(new URL('./0015_public_status_inventory.sql', import.meta.url)),
  'utf8',
)

describe('public status inventory migration', () => {
  test('upserts exactly the 28 canonical product ids', () => {
    const valuesBlock = sql.match(/VALUES\n([\s\S]+?)\nON CONFLICT \("product_id"\)/)?.[1]
    assert.ok(valuesBlock)
    const productIds = [...valuesBlock!.matchAll(/^\s*\('[a-f0-9]{24}', '([^']+)'/gm)].map((match) => match[1])
    assert.equal(productIds.length, 28)
    assert.equal(new Set(productIds).size, 28)
    assert.ok(productIds.includes('kaana'))
    assert.ok(productIds.includes('nilo'))
  })

  test('retires every production alias after preserving its row', () => {
    for (const legacy of ['c', 'i', 'fairwallet', 'faircoinexplorer', 'marketplace']) {
      assert.ok(sql.includes(`('${legacy}',`))
      assert.ok(sql.includes(`'${legacy}'`))
    }
    assert.ok(sql.includes('SET "show_on_status" = false'))
  })
})
