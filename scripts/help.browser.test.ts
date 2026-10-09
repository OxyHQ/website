import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
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
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => {
      (window as unknown as { copiedCode: string }).copiedCode = text
    } } })
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
  assert.equal(await send.isDisabled(), true)
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

  // The AI composer's native mic dictates into the draft without submitting.
  await page.evaluate(() => {
    const fixture = window as unknown as { SpeechRecognition: unknown; supportRecognition: { onresult: ((event: unknown) => void) | null; stop: () => void } }
    fixture.SpeechRecognition = class {
      lang = ''
      interimResults = false
      onresult: ((event: unknown) => void) | null = null
      onerror = null
      onend: (() => void) | null = null
      start() { fixture.supportRecognition = this }
      stop() { this.onend?.() }
      abort() { this.onend?.() }
    }
  })
  await page.getByRole('button', { name: 'Voice input', exact: true }).click()
  await page.evaluate(() => {
    const recognition = (window as unknown as { supportRecognition: { onresult: (event: unknown) => void; stop: () => void } }).supportRecognition
    recognition.onresult({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: 'A dictated support question' } }] })
    recognition.stop()
  })
  await page.waitForFunction(() => document.querySelector<HTMLTextAreaElement>('[data-testid=help-composer-input]')?.value === 'A dictated support question')
  assert.equal((await sentMessages()).length, 3)

  await page.goto(`${origin}/help/?q=Bitwarden`)
  await page.waitForFunction(() => document.querySelectorAll('[data-help-result]').length === 2)
  assert.ok((await page.locator('[data-help-result]').allTextContents()).some(text => text.includes('Change your password')))
  await page.locator('[data-help-result][href*="change-password"]').click()
  await page.waitForURL('**/help/account/change-password/')
  await page.locator('[data-article-body] h2').first().waitFor()
  assert.equal(await page.locator('h1').textContent(), 'Change your password')
  assert.equal(await page.locator('main').count(), 1)
  await page.getByRole('link', { name: 'View all articles', exact: true }).click()
  await page.locator('[data-help-result]').first().waitFor()
  assert.equal(await page.locator('[data-help-result]').count(), 14)
  // Help uses the manifesto's reading screen. Tutorial blocks, warning
  // callouts and code must remain in its prose column at every viewport.
  for (const slug of ['account/add-recovery-email', 'console/api-keys', 'inbox/encryption']) {
    await page.goto(`${origin}/help/${slug}/`)
    await page.locator('[data-article-body] h2').first().waitFor()
    assert.equal(await page.locator('meta[property="og:type"]').getAttribute('content'), 'article')
    assert.equal(await page.locator('nav[aria-label*="breadcrumb" i]').count(), 0)
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${slug} / ${width}: overflow`)
      const geometry = await page.locator('[data-article-body]').evaluate(body => {
        const prose = body.querySelector(':scope > p')!.getBoundingClientRect()
        return [...body.querySelectorAll(':scope > div, :scope > pre')].map(node => {
          const rect = node.getBoundingClientRect()
          return { left: rect.left - prose.left, right: rect.right - prose.right }
        })
      })
      assert.ok(geometry.every(rect => Math.abs(rect.left) < 2 && Math.abs(rect.right) < 2), `${slug}: article furniture leaves prose column`)
    }
    const tocLinks = await page.locator('[data-toc-rail] a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')!.slice(1)))
    assert.ok(tocLinks.length > 0)
    for (const id of tocLinks) assert.equal(await page.locator(`[data-article-body] [id="${id}"]`).count(), 1)
    if (slug === 'console/api-keys') {
      const expectedCode = readFileSync(new URL('../src/content/help/console/api-keys.mdx', import.meta.url), 'utf8').match(/```ts\n([\s\S]*?)\n```/)![1]
      await page.getByRole('button', { name: 'Copy code', exact: true }).click()
      assert.equal(await page.evaluate(() => (window as unknown as { copiedCode: string }).copiedCode), expectedCode)
      await page.getByRole('button', { name: 'Code copied', exact: true }).waitFor()
    }
  }
  await page.goto(`${origin}/es/help/account/add-recovery-email/`)
  await page.locator('[data-article-body] h2').first().waitFor()
  assert.ok((await page.locator('h1').textContent())?.includes('recuperación'))
  await page.goto(`${origin}/help/no-such-article/`)
  await page.getByRole('heading', { name: '404 — Page not found', exact: true }).waitFor()
  assert.ok((await page.locator('meta[name="robots"]').getAttribute('content'))?.includes('noindex'))
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
  await before.addInitScript(() => localStorage.setItem('theme', 'dark'))
  await before.goto(`${origin}/help/`)
  const prepaint = await before.evaluate(() => {
    return ['help-theme', 'help-photo-theme'].map(className => {
      const probe = document.createElement('div')
      probe.className = className
      document.body.appendChild(probe)
      const css = getComputedStyle(probe)
      return ['--background', '--foreground', '--primary', '--color-primary'].map(token => css.getPropertyValue(token).trim())
    })
  })
  const painted = await page.evaluate(() => ['help-theme', 'help-photo-theme'].map(className => {
    const css = getComputedStyle(document.querySelector(`.${className}`)!)
    return ['--background', '--foreground', '--primary', '--color-primary'].map(token => css.getPropertyValue(token).trim())
  }))
  assert.ok(prepaint.flat().every(Boolean))
  assert.deepEqual(prepaint, painted)
  assert.deepEqual(errors, [])
  console.log('Help browser checks passed: Bloom composer, Intercom handoff, timeout/retry, topics, links, locale, responsive layout, prepaint palette.')
} finally {
  await browser.close()
  preview?.kill()
}
