import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type Page } from 'playwright'

const ROOT = join(import.meta.dir, '..')
const MIN_USABLE_MENTION_FEED_WIDTH = 280
const MAX_STABLE_MENTION_PREVIEW_HEIGHT = 1200
const docsIndex = JSON.parse(
  readFileSync(join(ROOT, 'src', 'content', '_synced', 'index.json'), 'utf8'),
) as { packages: Array<{ shortName: string; latestVersion: string }> }
const bloom = docsIndex.packages.find((pkg) => pkg.shortName === 'bloom')

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

invariant(bloom, 'Bloom is absent from the synced docs index')

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
  } catch (error) {
    if (attempt === 49) throw error
  }
  await Bun.sleep(100)
}
invariant(previewReady, 'Vite preview did not start')

const browser = await chromium.launch({
  headless: true,
  // Same escape hatch the other two browser suites carry: Playwright resolves
  // its own pinned Chromium build, which a machine whose browser cache predates
  // the last `playwright` bump does not have.
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
})
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const pageErrors: string[] = []
page.on('pageerror', (error) => pageErrors.push(error.message))

async function assertGlobalChrome(activePage: Page): Promise<void> {
  await activePage.getByRole('banner').locator('nav').waitFor()
  const footer = activePage.locator('footer')
  await footer.waitFor({ state: 'attached' })
  await footer.scrollIntoViewIfNeeded()
  await footer.waitFor({ state: 'visible' })
  invariant(await activePage.locator('main').count() === 1, `expected one main landmark at ${activePage.url()}`)
  const overflow = await activePage.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  invariant(overflow <= 1, `page overflows horizontally by ${overflow}px at ${activePage.url()}`)
}

async function assertGlobalDocsChrome(activePage: Page): Promise<void> {
  await assertGlobalChrome(activePage)
  await activePage.locator('a[href="/developers/docs/services/"]').waitFor({ state: 'attached' })
}

async function openRoute(path: string): Promise<void> {
  await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' })
  await assertGlobalDocsChrome(page)
}

async function assertCurrentSidebarLink(href: string): Promise<void> {
  const sidebar = page.locator('aside')
  await sidebar.locator(`a[href="${href}"][aria-current="page"]`).waitFor()
  invariant(
    await sidebar.locator('a[aria-current="page"]').count() === 1,
    `expected exactly one current sidebar link at ${page.url()}`,
  )
}

async function assertContained(selector: string): Promise<void> {
  const measurement = await page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return { left: rect.left, right: rect.right, viewport: document.documentElement.clientWidth }
  })
  invariant(
    measurement.left >= -1 && measurement.right <= measurement.viewport + 1,
    `${selector} is clipped horizontally: ${JSON.stringify(measurement)}`,
  )
}

try {
  for (const path of ['/developers/docs/bloom/playground', '/developers/docs/bloom/playground/', `/developers/docs/bloom/${bloom.latestVersion}/playground`]) {
    await openRoute(path)
    await page.waitForURL(`${origin}/developers/docs/bloom/components/`)
    await page.getByPlaceholder('Search buttons, composers, calendars…').waitFor()
    invariant(await page.locator('main a[href*="/playground"]').count() === 0, 'catalog links to the retired playground')
  }

  await openRoute('/developers/docs/bloom/color-system')
  await page.locator('[data-testid="color-system-playground"]').waitFor()
  await assertCurrentSidebarLink('/developers/docs/bloom/color-system/')
  invariant(
    await page.getByRole('button', { name: /^Switch version/ }).count() === 0,
    'latest color playground must not expose historical docs version controls',
  )
  await assertContained('[data-testid="color-system-playground"]')
  const familyFilters = page.getByRole('group', { name: 'Color family filters' })
  const pairingFilters = page.getByRole('group', { name: 'Color pairing filters' })
  await familyFilters.getByRole('button', { name: 'All', exact: true, pressed: true }).waitFor()
  await pairingFilters.getByRole('button', { name: 'Curated combinations', exact: true, pressed: true }).waitFor()
  invariant(
    await page.locator('[data-testid^="color-recipe-"]').count() === 47,
    'curated filter did not render exactly 47 recipes',
  )
  await pairingFilters.getByRole('button', { name: 'All', exact: true }).click()
  await pairingFilters.getByRole('button', { name: 'All', exact: true, pressed: true }).waitFor()
  invariant(
    await page.locator('[data-testid^="color-recipe-"]').count() === 64,
    'all filter did not render exactly 64 recipes',
  )
  await page.getByRole('button', { name: 'Derived', exact: true }).click()
  await pairingFilters.getByRole('button', { name: 'Derived', exact: true, pressed: true }).waitFor()
  invariant(
    await page.locator('[data-testid^="color-recipe-"]').count() === 17,
    'derived filter did not render exactly 17 recipes',
  )
  await page.getByRole('radio', { name: 'Public view', exact: true }).click()
  await page.getByText("Don't miss what's happening", { exact: true }).first().waitFor()

  await openRoute('/developers/docs/bloom/color-system/')
  invariant(
    new URL(page.url()).pathname === '/developers/docs/bloom/color-system/',
    'trailing-slash canonical route must remain canonical instead of redirecting',
  )
  await page.locator('[data-testid="color-system-playground"]').waitFor()
  await assertCurrentSidebarLink('/developers/docs/bloom/color-system/')

  await openRoute(`/developers/docs/bloom/${bloom.latestVersion}/color-system`)
  await page.waitForURL(`${origin}/developers/docs/bloom/color-system/`)
  await page.locator('[data-testid="color-system-playground"]').waitFor()
  await assertCurrentSidebarLink('/developers/docs/bloom/color-system/')

  await openRoute(`/developers/docs/bloom/${bloom.latestVersion}`)
  invariant(
    await page.locator('main a[href="/developers/docs/bloom/color-system/"]').count() === 1,
    'Bloom overview must render one color-system hub link',
  )
  await page.locator('main a[href="/developers/docs/bloom/components/"]').waitFor()

  await page.goto(`${origin}/developers`, { waitUntil: 'domcontentloaded' })
  await assertGlobalChrome(page)
  await page.getByRole('link', { name: /^Bloom color system/ }).waitFor()
  await page.locator('main').getByRole('link', { name: /^Bloom components/ }).waitFor()

  for (const width of [1440, 1200, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    await openRoute('/developers/docs/bloom/color-system')
    await page.waitForFunction(
      ({ minWidth, maxHeight }) => {
        const content = document.querySelector('[data-testid="mention-content-light"]')
        if (!content) return false
        const rect = content.getBoundingClientRect()
        return rect.width >= minWidth && rect.height <= maxHeight
      },
      {
        minWidth: MIN_USABLE_MENTION_FEED_WIDTH,
        maxHeight: MAX_STABLE_MENTION_PREVIEW_HEIGHT,
      },
    )
    for (const selector of [
      '[data-testid="color-system-playground"]',
      '[data-testid="color-lab-heading"]',
      '[data-testid="color-lab-legend"]',
      '[data-testid="color-lab-filters"]',
      '[data-testid="color-lab-recipes"]',
    ]) {
      await assertContained(selector)
    }
    const contentBox = await page.locator('[data-testid="mention-content-light"]').boundingBox()
    invariant(contentBox, `Mention feed is absent at ${width}px`)
    invariant(
      contentBox.width >= MIN_USABLE_MENTION_FEED_WIDTH,
      `Mention feed collapsed to ${contentBox.width}px at ${width}px`,
    )
    invariant(
      contentBox.height <= MAX_STABLE_MENTION_PREVIEW_HEIGHT,
      `Mention preview grew to ${contentBox.height}px at ${width}px`,
    )
  }

  await openRoute('/developers/docs/bloom/playground')
  await page.waitForURL(`${origin}/developers/docs/bloom/components/`)
  await page.getByPlaceholder('Search buttons, composers, calendars…').waitFor()

  await page.setViewportSize({ width: 1440, height: 1000 })
  await openRoute(`/developers/docs/bloom/${bloom.latestVersion}/getting-started/`)
  const articleInstall = page.locator('[data-docs-install]').first()
  await articleInstall.getByRole('tab', { name: 'pnpm', exact: true }).click()
  invariant((await articleInstall.innerText()).includes('pnpm add @oxy.so/bloom'), 'MDX install blocks must use the shared package manager switcher')
  await page.getByRole('note').first().waitFor()
  invariant(await page.locator('main h1:visible').count() === 1, 'article duplicates the page title')

  for (const mode of ['light', 'dark']) {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.addInitScript((mode) => localStorage.setItem('theme', mode), mode)
    await page.route('**/*.js', (route) => route.abort())
    await page.goto(`${origin}/developers/docs/bloom/components/`)
    const prepaint = await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.className = 'docs-theme'
      probe.style.backgroundColor = 'color-mix(in srgb, var(--primary) 4%, var(--background))'
      document.body.appendChild(probe)
      return getComputedStyle(probe).backgroundColor
    })
    await page.unroute('**/*.js')
    await page.reload()
    const cards = page.locator('[data-catalog-card]')
    await cards.first().waitFor()
    invariant(await cards.count() >= 36, 'catalog omits existing Bloom compositions')
    await assertCurrentSidebarLink('/developers/docs/bloom/components/')
    invariant(await page.locator('main').evaluate((node) => getComputedStyle(node).backgroundColor) === prepaint,
      `${mode} catalog palette changes after JavaScript loads`)
    const search = page.getByPlaceholder('Search buttons, composers, calendars…')
    await search.fill('composer loader')
    await page.locator('[data-catalog-card="composer-loader"]').waitFor()
    invariant(await cards.count() === 1, 'catalog search does not filter visual examples')
    await page.locator('main').getByRole('link', { name: 'Composer loader', exact: true }).click()
    await page.getByRole('heading', { name: 'Preview', exact: true }).waitFor()
    await page.locator('main [data-bloom-composer-pill]').waitFor()
    await assertCurrentSidebarLink('/developers/docs/bloom/components/composer-loader/')
    invariant(await page.locator('main .bloom-preview-fallback').count() === 0, 'catalog detail demo failed')
    const example = page.locator('[data-docs-example]').first()
    await example.getByRole('tab', { name: 'Code', exact: true }).click()
    invariant((await example.innerText()).includes('ComposerLoader'), 'example code must document the rendered composer')
    await example.getByRole('tab', { name: 'Preview', exact: true }).click()
    await page.locator('main [data-bloom-composer-pill]').waitFor()
    const install = page.locator('[data-docs-install]')
    await install.getByRole('tab', { name: 'bun', exact: true }).click()
    invariant((await install.innerText()).includes('bun add @oxy.so/bloom'), 'package-manager tab did not update the install command')

    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 900 })
      await assertGlobalDocsChrome(page)
    }
    const navigationToggle = page.getByRole('button', { name: 'Documentation navigation', exact: true })
    await navigationToggle.click()
    await page.getByPlaceholder('Quick search…').fill('Calendar')
    await page.locator('[data-docs-navigation] a[href="/developers/docs/bloom/components/calendar/"]').click()
    await page.getByRole('heading', { name: 'Calendar', exact: true }).waitFor()
    invariant(await navigationToggle.getAttribute('aria-expanded') === 'false', 'mobile navigation must close after selecting a search result')
    await assertGlobalDocsChrome(page)
    await openRoute('/developers/docs/bloom/components/')
    await cards.first().waitFor()
    await assertGlobalDocsChrome(page)
    await search.fill('no-matching-component-xyz')
    await page.getByRole('heading', { name: 'No matching components' }).waitFor()
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click()
    await cards.first().waitFor()
  }

  invariant(pageErrors.length === 0, `browser page errors: ${pageErrors.join('; ')}`)
  console.info('[docs-special-routes] global chrome, playgrounds, catalog previews/search, example tabs, install commands, mobile navigation, light/dark prepaint and responsive overflow passed')
} finally {
  await context.close()
  await browser.close()
  preview.kill()
  await preview.exited
}
