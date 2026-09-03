import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { describe, expect, test } from 'bun:test'

const CANONICAL_LOGO_SHA256 = '69fae83bc32a7df5a083616160ffc978a3256f30a918cb0e512567442b7a2be2'
const WEBSITE_ROOT = new URL('../', import.meta.url)

function sha256(contents: Uint8Array): string {
  return createHash('sha256').update(contents).digest('hex')
}

async function repositoryFile(path: string): Promise<string> {
  return readFile(new URL(path, WEBSITE_ROOT), 'utf8')
}

describe('Kaana public brand contract', () => {
  test('ships the exact canonical source logo', async () => {
    const logo = await readFile(new URL('public/images/apps/kaana.svg', WEBSITE_ROOT))
    expect(sha256(logo)).toBe(CANONICAL_LOGO_SHA256)
  })

  test('uses the source SVG without recoloring or optimization', async () => {
    const [seed, content, navbar, viteConfig] = await Promise.all([
      repositoryFile('server/seed.ts'),
      repositoryFile('src/data/content.ts'),
      repositoryFile('src/components/layout/Navbar.tsx'),
      repositoryFile('vite.config.ts'),
    ])

    expect(seed).toContain("kaana: '/images/apps/kaana.svg'")
    expect(content).toContain("href: 'https://kaana.ai', image: '/images/apps/kaana.svg', preserveImageColors: true")
    expect(navbar).toContain("product.productId === 'kaana'")
    expect(viteConfig).toContain('exclude: /kaana\\.svg$/')
    expect(seed).not.toContain('kaana.png')
    expect(content).not.toContain('kaana.png')
  })

  test('rejects changed logo bytes', async () => {
    const logo = new Uint8Array(await readFile(new URL('public/images/apps/kaana.svg', WEBSITE_ROOT)))
    const mutated = logo.slice()
    const midpoint = Math.floor(mutated.length / 2)
    const original = mutated.at(midpoint)
    if (original === undefined) throw new Error('the canonical Kaana logo is empty')
    mutated[midpoint] = original ^ 1
    expect(sha256(mutated)).not.toBe(CANONICAL_LOGO_SHA256)
  })
})
