import { strict as assert } from 'node:assert'
import { chromium } from 'playwright'

const reserved = Bun.serve({ port: 0, fetch: () => new Response('reserved') })
const port = reserved.port
reserved.stop(true)
const preview = process.env.TEST_ORIGIN ? undefined : Bun.spawn(['bunx', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdout: 'ignore', stderr: 'ignore' })
const origin = process.env.TEST_ORIGIN || `http://127.0.0.1:${port}`
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined })
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(origin)).ok) break } catch { /* Preview starting. */ }
    await Bun.sleep(100)
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin !== origin) return route.abort()
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, json: { error: 'Offline test' } })
    return route.continue()
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${origin}/help/`)
  await page.locator('[data-help-center]').waitFor()
  assert.equal(await page.locator('main').count(), 1)
  assert.equal(await page.locator('h1').count(), 1)
  const search = page.getByRole('searchbox')
  await search.fill('Bitwarden')
  await page.waitForFunction(() => document.querySelectorAll('[data-help-result]').length === 2)
  assert.ok((await page.locator('[data-help-result]').allTextContents()).some(text => text.includes('Change your password')))
  await search.press('Enter')
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'help-results-heading')
  await page.reload()
  await page.locator('[data-help-result]').first().waitFor()
  assert.equal(await search.inputValue(), 'Bitwarden')
  await page.locator('[data-help-result][href*="change-password"]').click()
  await page.waitForURL('**/help/account/change-password/')
  await page.goto(`${origin}/help/`)
  await page.locator('[data-help-topic="inbox"]').click()
  await page.locator('[data-help-result]').first().waitFor()
  assert.equal(await page.locator('[data-help-result]').count(), 3)
  assert.ok((await page.locator('[data-help-result]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).every(href => href?.includes('/inbox/')))
  await page.getByRole('link', { name: 'Clear filters' }).click()
  await search.fill('no-such-help-article-98765')
  await page.getByText('No articles found. Try another search or clear the filters.').waitFor()
  await page.getByRole('link', { name: 'Clear filters' }).click()
  await page.waitForFunction(() => document.querySelector<HTMLInputElement>('input[name=q]')?.value === '')
  await page.goto(`${origin}/es/help/?q=recuperacion`)
  await page.locator('[data-help-result]').first().waitFor()
  assert.ok((await page.locator('[data-help-result]').allTextContents()).some(text => text.includes('recuperación')))
  for (const theme of ['light', 'dark']) {
    await page.addInitScript(mode => localStorage.setItem('theme', mode), theme)
    await page.goto(`${origin}/help/`)
    await page.locator('[data-help-center]').waitFor()
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${theme} / ${width}: overflow`)
    }
  }
  // The scoped photo palette must exist before React, not just after its JS loads.
  const before = await context.newPage()
  await before.route('**/*.js', route => route.abort())
  await before.goto(`${origin}/help/`)
  const prepaint = await before.evaluate(() => {
    const probe = document.createElement('div')
    probe.className = 'help-photo-theme bg-background text-foreground'
    document.body.appendChild(probe)
    const css = getComputedStyle(probe)
    return [css.getPropertyValue('--background').trim(), css.getPropertyValue('--foreground').trim()]
  })
  const painted = await page.locator('.help-photo-theme').first().evaluate(node => {
    const css = getComputedStyle(node)
    return [css.getPropertyValue('--background').trim(), css.getPropertyValue('--foreground').trim()]
  })
  assert.ok(prepaint.every(Boolean))
  assert.deepEqual(prepaint, painted)
  assert.deepEqual(errors, [])
  console.log('Help browser checks passed: search, topics, links, locale, responsive layout, prepaint palette.')
} finally {
  await browser.close()
  preview?.kill()
}
