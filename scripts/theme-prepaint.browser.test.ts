import { join } from 'node:path'
import { chromium } from 'playwright'
import { getPresetVars } from '@oxyhq/bloom/design-tokens'

const ROOT = join(import.meta.dir, '..')
const TOKENS = ['--background', '--card', '--primary', '--secondary', '--tertiary'] as const

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function normalizeColor(value: string): string {
  const normalized = value.trim().toLowerCase()
  const shortHex = normalized.match(/^#([0-9a-f]{3})$/)
  if (shortHex?.[1]) {
    return [...shortHex[1]].map((digit) => Number.parseInt(`${digit}${digit}`, 16)).join(',')
  }
  const hex = normalized.match(/^#([0-9a-f]{6})$/)
  if (hex?.[1]) {
    return [0, 2, 4].map((offset) => Number.parseInt(hex[1]!.slice(offset, offset + 2), 16)).join(',')
  }
  // Vite may minify the generated value to hex, while browsers may serialize
  // modern `rgb(1 2 3)` syntax as legacy `rgb(1, 2, 3)`.
  return [...normalized.matchAll(/[\d.]+/g)].map((match) => match[0]).join(',')
}

// Ask the OS for a free port, then let Vite preview serve the built app. This
// exercises its real SPA fallback and MIME behavior rather than a test-only
// approximation of the production server.
const reservation = Bun.serve({ port: 0, fetch: () => new Response('reserved') })
const port = reservation.port
reservation.stop(true)
const preview = Bun.spawn(
  ['bunx', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { cwd: ROOT, stdout: 'ignore', stderr: 'ignore' },
)
const origin = `http://127.0.0.1:${port}`
let previewReady = false
for (let attempt = 0; attempt < 50; attempt += 1) {
  try {
    if ((await fetch(origin)).ok) {
      previewReady = true
      break
    }
  } catch {
    // The preview process is still binding the port.
  }
  await Bun.sleep(100)
}
invariant(previewReady, 'Vite preview did not start')

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext()
const page = await context.newPage()
const pageErrors: string[] = []
page.on('pageerror', (error) => pageErrors.push(error.message))

try {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('theme', 'light')
      localStorage.setItem('colorPreset', 'cobalt')
    } catch {
      // about:blank has no storage origin; the same init script runs again for
      // the actual document where localStorage is available.
    }
  })

  // Abort every externally requested script. Inline host/prepaint scripts still
  // execute, while React and the application bundle provably do not.
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() === 'script') await route.abort()
    else await route.continue()
  })
  await page.goto(origin, { waitUntil: 'load' })
  const preReact = await page.evaluate((tokens) => {
    const root = document.documentElement
    const styles = getComputedStyle(root)
    return {
      preset: root.getAttribute('data-color-preset'),
      dark: root.classList.contains('dark'),
      inlinePrimary: root.style.getPropertyValue('--primary'),
      values: Object.fromEntries(tokens.map((token) => [token, styles.getPropertyValue(token).trim()])),
    }
  }, TOKENS)
  invariant(preReact.preset === 'cobalt', `prepaint preset was ${preReact.preset}`)
  invariant(!preReact.dark, 'prepaint did not apply saved light mode')
  invariant(preReact.inlinePrimary === '', 'external app JavaScript unexpectedly applied inline tokens')

  const expected = getPresetVars('cobalt', 'light')
  for (const token of TOKENS) {
    invariant(
      normalizeColor(preReact.values[token] ?? '') === normalizeColor(expected[token] ?? ''),
      `prepaint ${token} does not match Bloom cobalt light: ${preReact.values[token]} !== ${expected[token]}`,
    )
  }

  await page.unroute('**/*')
  await page.reload({ waitUntil: 'load' })
  await page.waitForFunction(() => document.documentElement.style.getPropertyValue('--primary') !== '')
  const postReact = await page.evaluate((tokens) => {
    const root = document.documentElement
    const styles = getComputedStyle(root)
    return Object.fromEntries(tokens.map((token) => [token, styles.getPropertyValue(token).trim()]))
  }, TOKENS)
  for (const token of TOKENS) {
    invariant(
      normalizeColor(preReact.values[token] ?? '') === normalizeColor(postReact[token] ?? ''),
      `cobalt ${token} changed between prepaint and React`,
    )
  }

  // Exercise an in-app route transition: the thumbnail asks the ONE provider
  // for dark mode without changing the saved light preference, then leaving it
  // restores light and the same preset.
  await page.evaluate(() => {
    history.pushState({}, '', '/developers/docs/_thumbnail/Button?theme=dark')
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }))
  })
  await page.locator('[data-thumbnail-root]').waitFor()
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'))
  const thumbnailTokens = await page.evaluate((tokens) => {
    const styles = getComputedStyle(document.documentElement)
    return Object.fromEntries(tokens.map((token) => [token, styles.getPropertyValue(token).trim()]))
  }, TOKENS)
  const expectedDark = getPresetVars('cobalt', 'dark')
  for (const token of TOKENS) {
    invariant(
      normalizeColor(thumbnailTokens[token] ?? '') === normalizeColor(expectedDark[token] ?? ''),
      `thumbnail ${token} does not match Bloom cobalt dark`,
    )
  }
  invariant(await page.evaluate(() => localStorage.getItem('theme')) === 'light', 'thumbnail persisted its dark override')

  await page.evaluate(() => {
    history.pushState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }))
  })
  await page.locator('main.oxy-landing').waitFor()
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'))
  const restoredTokens = await page.evaluate((tokens) => {
    const styles = getComputedStyle(document.documentElement)
    return Object.fromEntries(tokens.map((token) => [token, styles.getPropertyValue(token).trim()]))
  }, TOKENS)
  for (const token of TOKENS) {
    invariant(
      normalizeColor(restoredTokens[token] ?? '') === normalizeColor(expected[token] ?? ''),
      `leaving thumbnail did not restore cobalt light ${token}`,
    )
  }
  invariant(await page.evaluate(() => localStorage.getItem('theme')) === 'light', 'leaving thumbnail changed saved mode')
  invariant(await page.evaluate(() => localStorage.getItem('colorPreset')) === 'cobalt', 'thumbnail changed saved preset')
  invariant(pageErrors.length === 0, `browser page errors: ${pageErrors.join('; ')}`)

  console.log('[theme-prepaint] cobalt prepaint matches React; thumbnail route restores light mode')
} finally {
  await context.close()
  await browser.close()
  preview.kill()
  await preview.exited
}
