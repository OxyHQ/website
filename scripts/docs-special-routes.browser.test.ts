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

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
const pageErrors: string[] = []
page.on('pageerror', (error) => pageErrors.push(error.message))

async function assertGlobalChrome(activePage: Page): Promise<void> {
  await activePage.locator('header nav').waitFor()
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
  await activePage.locator('a[href="/developers/docs/services"]').waitFor({ state: 'attached' })
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
  await openRoute('/developers/docs/bloom/playground')
  await page.getByRole('heading', { name: 'Playground', exact: true }).waitFor()
  await page.getByText('Pick a component and tweak its props to see the live preview update.').waitFor()
  await page.locator('a[href="/developers/docs/bloom/color-system"]').first().waitFor()
  await assertCurrentSidebarLink('/developers/docs/bloom/playground')
  invariant(
    await page.getByRole('button', { name: /^Switch version/ }).count() === 0,
    'latest component playground must not expose historical docs version controls',
  )

  await openRoute(`/developers/docs/bloom/${bloom.latestVersion}/playground`)
  await page.waitForURL(`${origin}/developers/docs/bloom/playground`)
  await page.getByRole('heading', { name: 'Playground', exact: true }).waitFor()
  await assertCurrentSidebarLink('/developers/docs/bloom/playground')

  await openRoute('/developers/docs/bloom/color-system')
  await page.locator('[data-testid="color-system-playground"]').waitFor()
  await assertCurrentSidebarLink('/developers/docs/bloom/color-system')
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
    await page.locator('[data-testid^="color-recipe-"]').count() === 46,
    'curated filter did not render exactly 46 recipes',
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
    await page.locator('[data-testid^="color-recipe-"]').count() === 18,
    'derived filter did not render exactly 18 recipes',
  )
  await page.getByRole('button', { name: 'Public view', exact: true }).click()
  await page.getByText("Don't miss what's happening", { exact: true }).first().waitFor()

  await openRoute(`/developers/docs/bloom/${bloom.latestVersion}/color-system`)
  await page.waitForURL(`${origin}/developers/docs/bloom/color-system`)
  await page.locator('[data-testid="color-system-playground"]').waitFor()
  await assertCurrentSidebarLink('/developers/docs/bloom/color-system')

  await openRoute(`/developers/docs/bloom/${bloom.latestVersion}`)
  invariant(
    await page.locator('main a[href="/developers/docs/bloom/color-system"]').count() === 1,
    'Bloom overview must render one color-system hub link',
  )
  await page.locator('main a[href="/developers/docs/bloom/playground"]').waitFor()

  await page.goto(`${origin}/developers`, { waitUntil: 'domcontentloaded' })
  await assertGlobalChrome(page)
  await page.getByRole('link', { name: /^Bloom color system/ }).waitFor()
  await page.getByRole('link', { name: /^Bloom component playground/ }).waitFor()

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
  await page.getByRole('heading', { name: 'Playground', exact: true }).waitFor()

  invariant(pageErrors.length === 0, `browser page errors: ${pageErrors.join('; ')}`)
  console.info('[docs-special-routes] global chrome, both playgrounds, 64/46/18 filters and responsive overflow passed')
} finally {
  await context.close()
  await browser.close()
  preview.kill()
  await preview.exited
}
