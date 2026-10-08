import { chromium } from 'playwright'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const reserved = Bun.serve({ port: 0, fetch: () => new Response('reserved') })
const port = reserved.port
reserved.stop(true)
const preview = process.env.TEST_ORIGIN ? undefined : Bun.spawn(['bun', 'x', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdout: 'ignore', stderr: 'ignore' })
const origin = process.env.TEST_ORIGIN || `http://127.0.0.1:${port}`
if (preview) {
  let ready = false
  for (let attempt = 0; attempt < 50 && !ready; attempt++) {
    try { ready = (await fetch(origin)).ok } catch { /* Preview is starting. */ }
    if (!ready) await Bun.sleep(100)
  }
  if (!ready) { preview.kill(); throw new Error('Vite preview did not start') }
}
const post = {
  slug: 'reading-progress-test', title: 'Reading progress test',
  content: readFileSync(new URL('../src/content/newsroom-previews/article-components-showcase.md.txt', import.meta.url), 'utf8'),
  resume: 'Synthetic article for the reading test.', categories: ['Engineering'], tags: [], products: [],
  authorUsername: 'Test author', publishedAt: '2026-08-22T09:00:00.000Z', themePreset: 'oxy',
}
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE || undefined })
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const errors: string[] = []
page.on('pageerror', (error) => errors.push(error.message))
let legalState: 'published' | 'empty' | 'error' = 'published'
let newsroomError = false
await context.route('**/*', async (route) => {
  const url = new URL(route.request().url())
  if (url.origin !== origin && url.origin !== 'https://website-api.oxy.so') return route.abort()
  if (url.origin === origin && url.pathname.startsWith('/newsroom/') && route.request().resourceType() === 'document') {
    const response = await route.fetch()
    // Exercise an uncached feed and its API error/retry state. A full build
    // embeds live posts in the HTML; those must not override this fixture.
    const body = (await response.text()).replace(/<template\b[^>]*\bid="newsroom-(?:index|post)-bootstrap"[^>]*>[\s\S]*?<\/template>/g, '')
    return route.fulfill({ response, body })
  }
  if (url.pathname === '/api/newsroom') return newsroomError
    ? route.fulfill({ status: 503, json: { error: 'Unavailable' } })
    : route.fulfill({ json: { posts: [post], total: 1, page: 1, pages: 1 } })
  if (url.pathname === `/api/newsroom/${post.slug}`) return route.fulfill({ json: post })
  if (url.pathname === '/api/pages/legal-privacy') {
    if (legalState === 'error') return route.fulfill({ status: 503, json: { error: 'Unavailable' } })
    return route.fulfill({ json: {
      _id: 'test-privacy', slug: 'legal-privacy', title: 'Privacy Policy', description: 'A test policy.',
      sections: legalState === 'empty' ? [] : [
        { type: 'text', heading: 'Your data', order: 0, content: '<p>Policy test content.</p><h3>Retention</h3><p>Retention details.</p><a href="/legal/terms">Terms</a><img src="x" onerror="alert(1)" />' },
        { type: 'text', heading: 'Your choices', order: 1, content: '<p>Contact the team.</p>' },
      ],
    } })
  }
  if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, json: { error: 'Test: API unavailable' } })
  return route.continue()
})

async function visit(path: string, title: string) {
  await page.goto(`${origin}${path}`)
  await page.getByRole('heading', { level: 1, name: title, exact: true }).waitFor()
  assert.equal(await page.locator('h1').count(), 1)
  assert.equal(await page.locator('main').count(), 1)
}

try {
  await visit('/transparency/', 'Transparency Center')
  assert.equal(await page.locator('#documents a[href="/transparency/manifesto/"]').count(), 1)
  await page.screenshot({ path: '/tmp/transparency-desktop.png' })
  await visit('/transparency/legal/', 'Legal documents')
  assert.equal(await page.locator('#documents ul li').count(), 8)
  await page.locator('#documents a[href="/transparency/legal/privacy/"]').click()
  await page.getByText('Policy test content.', { exact: true }).waitFor()
  assert.equal(await page.locator('[data-article-body] img').count(), 0)
  assert.equal(await page.locator('[data-article-body] a[href="/transparency/legal/terms/"]').count(), 1)
  await page.getByRole('navigation', { name: 'Table of contents' }).getByRole('button', { name: 'Expand section', exact: true }).first().click()
  await page.getByRole('navigation', { name: 'Table of contents' }).getByRole('link', { name: 'Retention', exact: true }).last().click()
  assert.ok(page.url().endsWith('#section-1-heading-1'))
  await page.screenshot({ path: '/tmp/transparency-legal-desktop.png' })

  for (const [from, to, title] of [
    ['/company/manifesto/?source=test#summary', '/transparency/manifesto/?source=test#summary', 'The Oxy Manifesto: Alternatives, Not Slogans'],
    ['/company/transparency/', '/transparency/', 'Transparency Center'],
    ['/legal/privacy/', '/transparency/legal/privacy/', 'Privacy Policy'],
  ]) {
    await visit(from, title)
    assert.equal(page.url(), `${origin}${to}`)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  for (const [path, title] of [['/transparency/', 'Transparency Center'], ['/transparency/legal/', 'Legal documents'], ['/transparency/legal/privacy/', 'Privacy Policy']]) {
    await visit(path, title)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Mobile overflow: ${path}`)
  }
  await page.screenshot({ path: '/tmp/transparency-mobile.png' })
  legalState = 'error'
  await visit('/transparency/legal/privacy/', 'Privacy Policy')
  await page.getByRole('heading', { name: 'Document unavailable' }).waitFor()
  legalState = 'empty'
  await page.getByRole('button', { name: 'Try again' }).click()
  await page.getByRole('heading', { name: 'Publication pending' }).waitFor()
  console.log('PASS transparency: shared reader, catalogue, redirects, mobile, sanitization and API states')

  await page.setViewportSize({ width: 1440, height: 1000 })
  await visit('/newsroom/', 'Newsroom')
  await page.locator(`main a[href="/newsroom/${post.slug}/"]`).waitFor()
  newsroomError = true
  await page.reload()
  await page.getByRole('alert').waitFor()
  newsroomError = false
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await page.locator(`main a[href="/newsroom/${post.slug}/"]`).click()
  await page.getByRole('heading', { level: 1, name: post.title, exact: true }).waitFor()
  await page.locator('[data-reading-body]').waitFor({ state: 'attached' })
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0) })
  await page.getByLabel('0% read', { exact: true }).waitFor()
  // The end of the prose must read 100% while comments and footer remain below.
  await page.evaluate(() => {
    const range = document.createRange()
    range.selectNodeContents(document.querySelector('[data-reading-body]')!)
    window.scrollTo(0, window.scrollY + range.getBoundingClientRect().bottom - innerHeight + 2)
  })
  await page.getByLabel('100% read', { exact: true }).waitFor()
  assert.ok(await page.evaluate(() => document.documentElement.scrollHeight - scrollY - innerHeight > 200))
  const indicator = page.locator('[data-reading-progress]')
  let indicatorBox = (await indicator.boundingBox())!
  assert.ok(Math.abs(indicatorBox.y + indicatorBox.height - 1000) < 2, 'Reading indicator must stick to the viewport bottom inside the article')
  // Appending unrelated content must not dilute article progress.
  await page.evaluate(() => {
    const extra = document.createElement('div')
    extra.style.height = '5000px'
    document.body.appendChild(extra)
    dispatchEvent(new Event('resize'))
  })
  await page.getByLabel('100% read', { exact: true }).waitFor()
  await page.evaluate(() => {
    const article = document.querySelector('[data-reading-progress]')!.closest('article')!
    window.scrollTo(0, scrollY + article.getBoundingClientRect().bottom - 300)
  })
  await page.waitForFunction(() => {
    const indicator = document.querySelector('[data-reading-progress]')!
    return indicator.getBoundingClientRect().bottom < 500
  })
  indicatorBox = (await indicator.boundingBox())!
  const articleBottom = await indicator.evaluate((el) => el.closest('article')!.getBoundingClientRect().bottom)
  assert.ok(indicatorBox.y + indicatorBox.height <= articleBottom + 1, 'Reading indicator must stop at the article boundary')
  await page.screenshot({ path: '/tmp/newsroom-reading-progress.png' })
  console.log('PASS newsroom: 0% before the body, 100% at its end, unaffected by the rest of the page')
  await visit('/transparency/', 'Transparency Center')
  const settingsButton = page.getByRole('button', { name: 'Settings', exact: true })
  await settingsButton.hover()
  assert.equal(await page.getByRole('dialog', { name: 'Settings', exact: true }).count(), 0)
  await settingsButton.click()
  let settings = page.getByRole('dialog', { name: 'Settings', exact: true })
  await settings.waitFor()
  assert.ok(await settings.getAttribute('data-bloom-settings-dialog') !== null, 'Must use Bloom SettingsModal')
  await settings.getByRole('radio', { name: 'Light', exact: true }).click()
  await page.waitForFunction(() => localStorage.getItem('theme') === 'light')
  await settings.getByRole('radio', { name: 'Dark', exact: true }).click()
  await page.waitForFunction(() => localStorage.getItem('theme') === 'dark')
  await page.keyboard.press('Escape')
  await settings.waitFor({ state: 'hidden' })
  assert.equal(await settingsButton.evaluate((el) => el === document.activeElement), true)
  await page.setViewportSize({ width: 390, height: 844 })
  await settingsButton.click()
  settings = page.getByRole('dialog', { name: 'Settings', exact: true })
  await settings.waitFor()
  await settings.getByRole('button', { name: 'Theme', exact: true }).click()
  await settings.getByRole('radio', { name: 'Dark', exact: true }).click()
  await page.waitForFunction(() => localStorage.getItem('theme') === 'dark')
  await settings.getByRole('button', { name: 'Back', exact: true }).click()
  await settings.getByRole('button', { name: 'Language', exact: true }).click()
  await settings.getByRole('button', { name: 'Español', exact: true }).click()
  await page.waitForURL('**/es/transparency/')
  assert.equal(await page.evaluate(() => localStorage.getItem('oxy:locale')), 'es')
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  console.log('PASS Bloom settings: click only, theme persistence, Escape/focus, mobile and language')
  assert.deepEqual(errors, [], 'Unexpected browser errors')
} finally {
  await browser.close()
  preview?.kill()
  if (preview) await preview.exited
}
