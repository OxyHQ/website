import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, type Page } from 'playwright'

const root = join(import.meta.dir, '..')
const output = join(root, 'review-artifacts')
mkdirSync(output, { recursive: true })
const reservation = Bun.serve({ port: 0, fetch: () => new Response('reserved') })
const port = reservation.port
reservation.stop(true)
const preview = Bun.spawn(
  ['bunx', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { cwd: root, stdout: 'ignore', stderr: 'ignore' },
)
const origin = `http://127.0.0.1:${port}`
function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message)
}
let ready = false
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(origin)).ok) {
      ready = true
      break
    }
  } catch {
    /* waiting for preview */
  }
  await Bun.sleep(100)
}
invariant(ready, 'Preview failed to start')
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
})
const page = await context.newPage()
const errors: string[] = []
page.on('pageerror', (e) => errors.push(e.message))
async function capture(selector: string, name: string) {
  const element = page.locator(selector)
  await element.scrollIntoViewIfNeeded()
  await element.screenshot({ path: join(output, name), animations: 'disabled' })
}
async function assertFits(p: Page, path: string) {
  const overflow = await p.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  invariant(overflow <= 1, `${path}: horizontal overflow ${overflow}px`)
}
try {
  await page.goto(`${origin}/brand/`)
  await page.getByRole('heading', { level: 1, name: 'Technology belongs to people.' }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  await capture('.brand-cover', 'brand-cover-desktop.png')
  await capture('.brand-identity-boards', 'brand-identity.png')
  await capture('.brand-colour-composition', 'brand-colour.png')
  await capture('#applications', 'brand-applications.png')
  await page.getByRole('button', { name: 'Orange recipe', exact: true }).click()
  await page.getByLabel('Colour studio appearance', { exact: true }).selectOption('dark')
  invariant(
    (await page.getByTestId('brand-colour-composition').getAttribute('data-recipe')) === 'orange',
    'Recipe did not change',
  )
  invariant(
    (await page.getByTestId('brand-colour-composition').getAttribute('data-mode')) === 'dark',
    'Appearance did not change',
  )
  invariant(
    (await page.getByRole('link', { name: 'Try this recipe' }).getAttribute('href'))?.includes(
      'recipe=orange&mode=dark',
    ),
    'Recipe link lost state',
  )
  await capture('.brand-colour-composition', 'brand-colour-dark.png')
  await page.getByLabel('Try a headline', { exact: true }).fill('An open world.')
  invariant(
    (await page.locator('.brand-type-specimen').innerText()) === 'An open world.',
    'Type specimen did not update',
  )
  await page.getByRole('button', { name: 'Support', exact: true }).click()
  await page
    .getByRole('heading', { name: 'Your message has not been sent.', exact: true })
    .waitFor()
  await page.getByRole('button', { name: 'What changes when I open this?' }).click()
  invariant(
    await page.locator('#brand-motion-answer').isVisible(),
    'Motion disclosure did not open',
  )
  await capture('#voice', 'brand-voice.png')
  for (const width of [390, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`${origin}/brand/`)
    await page.getByRole('heading', { level: 1 }).waitFor()
    await assertFits(page, `brand ${width}`)
    if (width === 390) await capture('.brand-cover', 'brand-cover-mobile.png')
  }
  invariant(errors.length === 0, `Brand errors: ${errors.join('; ')}`)
  // Exercise the original moving Homiio wheel as well as its static fallback.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(`${origin}/homiio/`)
    await page.getByRole('heading', { level: 1 }).waitFor()
    await page.evaluate(() => document.fonts.ready)
    await assertFits(page, `homiio ${width}`)
    await page.screenshot({ path: join(output, `homiio-${width}.png`) })
    await page
      .getByRole('heading', { name: 'Transparent listings', exact: true })
      .scrollIntoViewIfNeeded()
    await page.screenshot({ path: join(output, `homiio-scene-${width}.png`) })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${origin}/homiio/`)
  await page.getByRole('heading', { name: 'Transparent listings', exact: true }).waitFor()
  invariant(errors.length === 0, `Page errors: ${errors.join('; ')}`)
  console.log(
    '[website-review] brand controls, four widths, Homiio motion/fallback and screenshots passed',
  )
} catch (error) {
  await page
    .screenshot({ path: join(output, 'failure.png'), fullPage: true })
    .catch(() => undefined)
  throw error
} finally {
  await browser.close()
  preview.kill()
  await preview.exited
}
