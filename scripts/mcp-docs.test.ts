import { readdir, readFile } from 'node:fs/promises'
import { describe, expect, test } from 'bun:test'

/**
 * The public MCP docs once described static admin-minted tokens, query-string
 * tokens, a Mongo collection and an `api.oxy.so/mcp` endpoint — an
 * architecture that no longer exists — for months after it was retired
 * (OxyHQ/website#108, F15). Retired names may appear only inside a section whose
 * heading says it is about migration.
 */

const MCP_DOCS = new URL('../src/content/mcp/', import.meta.url)

const RETIRED: Array<{ label: string; pattern: RegExp }> = [
  { label: 'create_mcp_token', pattern: /create_mcp_token/ },
  { label: 'revoke_mcp_token', pattern: /revoke_mcp_token/ },
  { label: 'list_mcp_tokens', pattern: /list_mcp_tokens/ },
  { label: 'the /api/mcp-tokens route', pattern: /\/api\/mcp-tokens/ },
  { label: 'api.oxy.so/mcp', pattern: /(?<![\w-])api\.oxy\.so\/mcp/ },
  { label: 'a query-string token', pattern: /[?&]token=/ },
  { label: 'MongoDB', pattern: /\bmongo/i },
]

const HEADING = /^(#{1,6})\s+(.*)$/

export interface RetiredMention {
  line: number
  label: string
  text: string
}

/** Retired mentions outside a section titled as a migration. Fenced code is scanned too. */
export function findRetiredMentions(source: string): RetiredMention[] {
  const findings: RetiredMention[] = []
  // Level of the migration heading we are inside, or null.
  let migrationLevel: number | null = null
  let inFence = false
  source.split('\n').forEach((text, index) => {
    if (/^\s*(```|~~~)/.test(text)) inFence = !inFence
    const heading = inFence ? null : HEADING.exec(text)
    if (heading) {
      const level = heading[1].length
      if (migrationLevel !== null && level <= migrationLevel) migrationLevel = null
      if (migrationLevel === null && /migrat/i.test(heading[2])) {
        migrationLevel = level
        return
      }
    }
    if (migrationLevel !== null) return
    for (const { label, pattern } of RETIRED) {
      if (pattern.test(text)) findings.push({ line: index + 1, label, text: text.trim() })
    }
  })
  return findings
}

describe('MCP docs drift', () => {
  test('no retired MCP architecture outside a migration section', async () => {
    const files = (await readdir(MCP_DOCS)).filter((name) => /\.mdx?$/.test(name))
    expect(files.length).toBeGreaterThan(0)
    const problems: string[] = []
    for (const name of files) {
      const source = await readFile(new URL(name, MCP_DOCS), 'utf8')
      for (const finding of findRetiredMentions(source)) {
        problems.push(`src/content/mcp/${name}:${finding.line} mentions ${finding.label}: ${finding.text}`)
      }
    }
    expect(problems).toEqual([])
  })

  test('documents the current endpoint and OAuth sign-in', async () => {
    const [quickstart, authentication] = await Promise.all([
      readFile(new URL('quickstart.mdx', MCP_DOCS), 'utf8'),
      readFile(new URL('authentication.mdx', MCP_DOCS), 'utf8'),
    ])
    expect(quickstart).toContain('https://website-api.oxy.so/mcp')
    expect(authentication).toContain('/.well-known/oauth-protected-resource/mcp')
    expect(authentication).toContain('website.read')
    expect(authentication).toContain('website.write')
  })

  test('the detector allows a migration section and nothing after it', () => {
    const source = [
      '# Authentication',
      'Connect to website-api.oxy.so/mcp.',
      '## Migration from static tokens',
      'The old `create_mcp_token` tool and `?token=` URLs, stored in MongoDB, are gone.',
      '### Details',
      'Old endpoint api.oxy.so/mcp.',
      '## Revoking',
      'Use revoke_mcp_token.',
      '```',
      '# not a heading, still scanned: POST /mcp?token=abc',
      '```',
    ].join('\n')
    expect(findRetiredMentions(source).map((finding) => [finding.line, finding.label])).toEqual([
      [8, 'revoke_mcp_token'],
      [10, 'a query-string token'],
    ])
  })
})
