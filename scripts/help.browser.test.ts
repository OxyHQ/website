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
  await context.addInitScript(() => {
    const fixture = window as unknown as {
      Intercom: (command: string, ...args: unknown[]) => void
      supportCalls: unknown[][]
      supportReady: boolean
      supportCallbacks: (() => void)[]
    }
    fixture.supportCalls = []
    fixture.supportReady = false
    fixture.supportCallbacks = []
    fixture.Intercom = (command: string, ...args: unknown[]) => {
      fixture.supportCalls.push([command, ...args])
      if (command === 'ready') {
        const callback = args[0] as () => void
        if (fixture.supportReady) queueMicrotask(callback)
        else fixture.supportCallbacks.push(callback)
      }
    }
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${origin}/help/`)
  await page.locator('[data-help-center]').waitFor()
  assert.equal(await page.locator('main').count(), 1)
  assert.equal(await page.locator('h1').count(), 1)
  const composer = page.getByRole('textbox', { name: 'Ask Oxy support a question' })
  const send = page.getByRole('button', { name: 'Submit', exact: true })
  const sentMessages = () => page.evaluate(() => (window as unknown as { supportCalls: unknown[][] }).supportCalls.filter(call => call[0] === 'startConversation').map(call => call[1]))
  const ready = () => page.evaluate(() => {
    const fixture = window as unknown as { supportReady: boolean; supportCallbacks: (() => void)[] }
    fixture.supportReady = true
    fixture.supportCallbacks.splice(0).forEach(callback => { callback(); callback() })
  })
  assert.equal(await page.locator('[data-testid=help-composer]').count(), 1)
  await composer.fill('I need help with my account.\nMy message stays private.')
  assert.equal(new URL(page.url()).search, '')
  assert.equal(await page.locator('[data-help-result]').count(), 0)
  await send.click()
  await page.getByText('Opening support…').waitFor()
  assert.equal(await send.isDisabled(), true)
  assert.deepEqual(await sentMessages(), [])
  await ready()
  await page.waitForFunction(() => document.querySelector<HTMLTextAreaElement>('[data-testid=help-composer-input]')?.value === '')
  assert.deepEqual(await sentMessages(), ['I need help with my account.\nMy message stays private.'])
  assert.ok(await page.evaluate(() => (window as unknown as { supportCalls: unknown[][] }).supportCalls.some(call => call[0] === 'show')))
  await composer.fill('A second question')
  await composer.press('Enter')
  await page.waitForFunction(() => document.querySelector<HTMLTextAreaElement>('[data-testid=help-composer-input]')?.value === '')
  assert.deepEqual(await sentMessages(), ['I need help with my account.\nMy message stays private.', 'A second question'])
  await send.click()
  assert.equal((await sentMessages()).length, 2)

  // A blocked/slow SDK must leave the draft intact and never send it later.
  await page.clock.install()
  await page.evaluate(() => { (window as unknown as { supportReady: boolean }).supportReady = false })
  await composer.fill('Keep this draft if support is unavailable')
  await send.click()
  await page.getByText('Opening support…').waitFor()
  await page.clock.fastForward(20_100)
  await page.getByRole('alert').waitFor()
  assert.equal(await composer.inputValue(), 'Keep this draft if support is unavailable')
  await ready()
  assert.equal((await sentMessages()).length, 2)
  await send.click()
  await page.waitForFunction(() => document.querySelector<HTMLTextAreaElement>('[data-testid=help-composer-input]')?.value === '')
  assert.equal((await sentMessages()).length, 3)
  await page.clock.resume()

  await page.goto(`${origin}/help/?q=Bitwarden`)
  await page.waitForFunction(() => document.querySelectorAll('[data-help-result]').length === 2)
  assert.ok((await page.locator('[data-help-result]').allTextContents()).some(text => text.includes('Change your password')))
  await page.locator('[data-help-result][href*="change-password"]').click()
  await page.waitForURL('**/help/account/change-password/')
  await page.goto(`${origin}/help/`)
  await page.locator('[data-help-topic="inbox"]').click()
  await page.locator('[data-help-result]').first().waitFor()
  assert.equal(await page.locator('[data-help-result]').count(), 3)
  assert.ok((await page.locator('[data-help-result]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).every(href => href?.includes('/inbox/')))
  await page.getByRole('link', { name: 'Clear filters' }).click()
  await page.goto(`${origin}/help/?q=no-such-help-article-98765`)
  await page.getByText('No articles found. Try another search or clear the filters.').waitFor()
  await page.getByRole('link', { name: 'Clear filters' }).click()
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
  console.log('Help browser checks passed: Bloom composer, Intercom handoff, timeout/retry, topics, links, locale, responsive layout, prepaint palette.')
} finally {
  await browser.close()
  preview?.kill()
}
