/** Store previews stay local: no checkout, support messages or external requests. */
import { strict as assert } from 'node:assert'
import { chromium } from 'playwright'
import { STORE_PRODUCTS } from '../src/data/store'

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
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin !== origin) return route.abort()
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, json: { error: 'Offline test' } })
    return route.continue()
  })
  await context.addInitScript(() => {
    localStorage.setItem('theme', 'light')
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => {
      (window as unknown as { storeCopied: string }).storeCopied = text
    } }, configurable: true })
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`${origin}/store/`)
  const productLinks = page.locator('[data-store-product]')
  await productLinks.first().waitFor()
  assert.equal(await productLinks.count(), STORE_PRODUCTS.length)
  assert.ok(await productLinks.evaluateAll(nodes => nodes.every(node => node.tagName === 'A')))
  const assertStoreChrome = async () => {
    assert.equal(await page.locator('.site-banner').count(), 1)
    assert.equal(await page.locator('.site-banner').textContent(), 'Preview collection · Purchases unavailable')
    assert.equal(await page.locator('main').getByText('Preview collection. Products and prices are illustrative; no purchases or payments are available.', { exact: true }).count(), 0)
    await page.getByRole('heading', { level: 1, name: 'The Oxy Store', exact: true }).waitFor()
  }
  await assertStoreChrome()
  for (const width of [390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    const bounds = await page.evaluate(() => {
      const container = document.querySelector('footer .container')!
      const box = container.getBoundingClientRect()
      const css = getComputedStyle(container)
      const grid = document.querySelector('[data-store-grid]')!.getBoundingClientRect()
      return { left: box.left + parseFloat(css.paddingLeft), right: box.right - parseFloat(css.paddingRight), gridLeft: grid.left, gridRight: grid.right, titleLeft: document.querySelector('[data-store-header] h1')!.getBoundingClientRect().left }
    })
    assert.ok(Math.abs(bounds.gridLeft - bounds.left) < 1 && Math.abs(bounds.gridRight - bounds.right) < 1, `Collection grid follows the website container at ${width}`)
    assert.ok(Math.abs(bounds.titleLeft - bounds.left) < 1, `Store title aligns with its collection at ${width}`)
  }
  await page.setViewportSize({ width: 1440, height: 1000 })
  await productLinks.first().click()
  await page.waitForURL('**/store/p/everyday-tee/')
  await page.getByRole('heading', { level: 2, name: 'Oxy Everyday Tee', exact: true }).waitFor()
  await assertStoreChrome()
  assert.equal(await page.locator('h1').count(), 1)
  assert.equal(await page.locator('main').count(), 1)
  await page.locator('link[rel=canonical][href="https://oxy.so/store/p/everyday-tee/"]').waitFor({ state: 'attached' })
  const gallery = page.getByRole('group', { name: 'Product images', exact: true })
  await gallery.locator('img').first().evaluate(async image => { await (image as HTMLImageElement).decode() })
  assert.ok(await gallery.locator('img').first().evaluate(image => (image as HTMLImageElement).naturalWidth >= 512))
  const saved = page.getByRole('button', { name: 'Saved on this device', exact: true })
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  assert.equal(await saved.getAttribute('aria-pressed'), 'true')
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  await page.waitForFunction(() => (window as unknown as { storeCopied?: string }).storeCopied?.endsWith('/store/p/everyday-tee/'))

  // Bloom owns focus trapping and Escape; the gallery owns arrow navigation and zoom.
  const firstPhoto = gallery.getByRole('button', { name: 'Open image viewer: Oxy Everyday Tee', exact: true })
  await firstPhoto.click()
  const lightbox = page.getByRole('dialog', { name: 'Product images', exact: true })
  await lightbox.waitFor()
  await lightbox.getByRole('button', { name: 'Close', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await lightbox.getByText('2 / 2', { exact: true }).waitFor()
  await lightbox.getByRole('button', { name: 'Zoom in', exact: true }).click()
  assert.equal(await lightbox.getByRole('button', { name: 'Zoom out', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.keyboard.press('ArrowLeft')
  await lightbox.getByText('1 / 2', { exact: true }).waitFor()
  await page.keyboard.press('Escape')
  await lightbox.waitFor({ state: 'hidden' })
  await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Open image viewer: Oxy Everyday Tee')

  // Unit and set are actual catalogue variants with distinct URLs and prices.
  await page.getByRole('link', { name: /^Set of 2 ·/ }).click()
  await page.waitForURL('**/store/p/everyday-tee-pair/')
  await page.getByRole('heading', { name: 'Oxy Everyday Tee · Set of 2', exact: true }).waitFor()
  await page.locator('[data-store-purchase]').getByRole('button', { name: 'Add to demo bag', exact: true }).click()
  const bag = page.getByRole('dialog', { name: 'Bag', exact: true })
  await bag.waitFor()
  await bag.getByTestId('store-cart').waitFor()
  await page.waitForFunction(() => { const rect = document.querySelector('[data-testid=store-bag-drawer]')!.getBoundingClientRect(); return Math.abs(rect.right - innerWidth) < 1 && Math.abs(rect.height - innerHeight) < 1 })
  assert.equal(await bag.getByRole('button', { name: /checkout/i }).count(), 0)
  await bag.getByRole('heading', { name: 'Bag [1]', exact: true }).waitFor()
  await bag.getByTestId('store-cart-line-everyday-tee-pair').locator('img').first().evaluate(async image => { await (image as HTMLImageElement).decode() })
  await bag.getByRole('button', { name: 'Increase', exact: true }).click()
  await bag.getByRole('heading', { name: 'Bag [2]', exact: true }).waitFor()
  assert.equal(await bag.getByText('€140', { exact: true }).count(), 2)
  await bag.getByRole('button', { name: 'Close', exact: true }).click()
  await bag.waitFor({ state: 'hidden' })
  await page.locator('[data-store-header]').getByRole('link', { name: 'The Oxy Store', exact: true }).click()
  await page.waitForURL('**/store/')
  await page.getByRole('button', { name: 'Bag [2]', exact: true }).waitFor()
  await page.reload()
  await page.getByRole('button', { name: 'Bag [2]', exact: true }).click()
  await bag.waitFor()
  await bag.getByTestId('store-cart-vendor').click()
  await page.waitForURL('**/store/')
  await bag.waitFor({ state: 'hidden' })
  await page.locator('[data-store-product=everyday-tee-pair]').click()
  await page.waitForURL('**/store/p/everyday-tee-pair/')

  // The one sticky action appears only while its inline counterpart is outside the viewport.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  const floating = page.locator('[data-store-floating-purchase]')
  await floating.waitFor({ state: 'visible' })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  const positions = await page.evaluate(() => ({
    title: document.querySelector('#store-product-title')!.getBoundingClientRect().top,
    gallery: document.querySelector('[role=group][aria-label="Product images"]')!.getBoundingClientRect().top,
    purchase: document.querySelector('[data-store-purchase]')!.getBoundingClientRect().top,
  }))
  assert.ok(positions.title < positions.gallery && positions.gallery < positions.purchase)
  await page.locator('[data-store-purchase]').scrollIntoViewIfNeeded()
  await floating.waitFor({ state: 'hidden' })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await floating.waitFor({ state: 'visible' })
  await floating.getByRole('button', { name: 'Add to demo bag', exact: true }).click()
  await bag.waitFor()
  await floating.waitFor({ state: 'hidden' })
  await page.waitForFunction(() => { const rect = document.querySelector('[data-testid=store-bag-drawer]')!.getBoundingClientRect(); return Math.abs(rect.right - innerWidth) < 1 && Math.abs(rect.height - innerHeight) < 1 })
  assert.ok(await bag.evaluate(node => node.scrollWidth <= node.clientWidth), 'Native cart must fit the mobile drawer')
  await bag.getByRole('button', { name: 'Decrease', exact: true }).click()
  await bag.getByRole('button', { name: 'Decrease', exact: true }).click()
  await bag.getByRole('button', { name: 'Remove Oxy Everyday Tee', exact: true }).click()
  await bag.getByText('Your bag is empty.', { exact: true }).waitFor()
  assert.equal(await bag.getByText('Demo total', { exact: true }).count(), 0)
  await bag.getByRole('button', { name: 'Close', exact: true }).click()
  await bag.waitFor({ state: 'hidden' })
  await page.getByRole('group', { name: 'Product images', exact: true }).getByRole('button').first().click()
  await lightbox.waitFor()
  await floating.waitFor({ state: 'hidden' })
  assert.ok(await lightbox.evaluate(node => { const bounds = node.getBoundingClientRect(); return bounds.width >= innerWidth - 1 && bounds.height >= innerHeight - 1 }))
  await page.keyboard.press('Escape')
  await lightbox.waitFor({ state: 'hidden' })

  await page.goto(`${origin}/store/p/everyday-tee/`)
  await saved.waitFor()
  assert.equal(await saved.getAttribute('aria-pressed'), 'true')
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await page.getByText('Single item', { exact: true }).last().waitFor()
  await page.getByRole('button', { name: 'Shipping & returns', exact: true }).click()
  await page.getByText('No orders are placed in this preview, and no delivery or return service is offered.', { exact: true }).waitFor({ state: 'visible' })
  for (const width of [390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Product overflow at ${width}`)
    if (width >= 1440) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      const alignment = await page.evaluate(() => {
        const container = document.querySelector('footer .container')!
        const bounds = container.getBoundingClientRect()
        const css = getComputedStyle(container)
        const purchase = document.querySelector('[data-store-purchase]')!.getBoundingClientRect()
        const gallery = document.querySelector('[role=group][aria-label="Product images"]')!.getBoundingClientRect()
        return {
          expectedLeft: bounds.left + parseFloat(css.paddingLeft),
          contentWidth: bounds.width - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight),
          titleLeft: document.querySelector('#store-product-title')!.getBoundingClientRect().left,
          storeTitleLeft: document.querySelector('[data-store-header] h1')!.getBoundingClientRect().left,
          contentGap: document.querySelector('#store-product-title')!.getBoundingClientRect().top - document.querySelector('[data-store-header]')!.getBoundingClientRect().bottom,
          purchaseLeft: purchase.left,
          purchaseWidth: purchase.width,
          galleryLeft: gallery.left,
        }
      })
      assert.ok(Math.abs(alignment.titleLeft - alignment.expectedLeft) < 1, `Title must follow the website container at ${width}`)
      assert.ok(Math.abs(alignment.storeTitleLeft - alignment.expectedLeft) < 1, 'Store header follows the shared container')
      assert.ok(alignment.contentGap >= 0 && alignment.contentGap < 12, 'Product content starts directly after its header')
      assert.ok(Math.abs(alignment.purchaseLeft - alignment.expectedLeft) < 1, `Buy box must follow the website container at ${width}`)
      assert.ok(alignment.purchaseWidth <= alignment.contentWidth / 3 + 1, `Buy box must stay compact at ${width}`)
      // The user's approved gallery keeps its original page-wide position.
      assert.ok(Math.abs(alignment.galleryLeft - (width === 1440 ? 619 : 819)) < 1, `Gallery position must remain unchanged at ${width}`)
    }
  }
  // Saved objects have a shareable route and remain available after a reload.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('[data-store-header]').getByRole('link', { name: 'Favorites [1]', exact: true }).click()
  await page.waitForURL('**/store/?view=favorites')
  await page.getByRole('heading', { name: 'Favorites [1]', exact: true }).waitFor()
  await assertStoreChrome()
  assert.equal(await productLinks.count(), 1)
  assert.equal(await productLinks.first().getAttribute('href'), '/store/p/everyday-tee/')
  assert.equal(await productLinks.locator('button').count(), 0, 'Favorite removal must not be nested in the product link')
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Favorites and shared header must fit mobile')
  await page.reload()
  await page.getByRole('heading', { name: 'Favorites [1]', exact: true }).waitFor()
  await productLinks.first().click()
  await page.waitForURL('**/store/p/everyday-tee/')
  await saved.waitFor()
  await page.locator('[data-store-header]').getByRole('link', { name: 'Favorites [1]', exact: true }).click()
  await page.getByRole('button', { name: 'Remove from favorites: Oxy Everyday Tee', exact: true }).click()
  await page.getByText('You haven’t saved any objects yet.', { exact: true }).waitFor()
  await page.locator('[data-store-header]').getByRole('link', { name: 'Favorites [0]', exact: true }).waitFor()
  assert.equal(await productLinks.count(), 0)
  await page.reload()
  await page.getByText('You haven’t saved any objects yet.', { exact: true }).waitFor()
  await page.getByRole('region', { name: 'Favorites', exact: true }).getByRole('button', { name: 'All objects', exact: true }).click()
  await page.waitForURL('**/store/')
  await productLinks.first().waitFor()
  assert.equal(await productLinks.count(), STORE_PRODUCTS.length)
  await page.goto(`${origin}/store/p/does-not-exist/`)
  await page.locator('meta[name=robots][content*="noindex"]').waitFor({ state: 'attached' })
  assert.equal(await page.locator('[data-store-purchase]').count(), 0)
  assert.deepEqual(errors, [])
  await context.close()
  console.log('Store browser checks passed: linked products, gallery keyboard/zoom, share/save, favorites collection, persistent bag, variants, mobile sticky CTA and unknown products.')
} finally {
  await browser.close()
  preview?.kill()
}
