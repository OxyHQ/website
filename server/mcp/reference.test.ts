import { readFile } from 'node:fs/promises'
import { describe, expect, test } from 'bun:test'
import { withToolReference } from './reference.js'

describe('public tool reference', () => {
  test('src/content/mcp/tools.mdx matches the catalog (run bun server/scripts/generate-mcp-tool-reference.ts)', async () => {
    const source = await readFile(new URL('../../src/content/mcp/tools.mdx', import.meta.url), 'utf8')
    expect(withToolReference(source)).toBe(source)
  })
})
