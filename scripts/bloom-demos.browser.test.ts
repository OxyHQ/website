import { join } from 'node:path'
import { chromium } from 'playwright'

/**
 * bloom-demos.browser.test.ts — render every Bloom demo, fail if one throws.
 *
 * A demo is live code written against one version of Bloom, and the next bump
 * can turn it into a throw. Two boundaries now contain that at runtime — the
 * component index marks the card "Example unavailable", `<BloomDemo>` prints a
 * failure in place of the example — and containment is the reason this check
 * has to exist: a boundary makes breakage cheap, and cheap breakage stays
 * broken. `Tabs` rendered `<TabsContent>` outside `<Tabs>` and threw against
 * Bloom 1.0.2; nobody knew, because the only page that mounted it was one
 * nobody had loaded.
 *
 * So this renders each demo ALONE at `/developers/docs/bloom/_demo/<Name>`,
 * where nothing catches anything, and fails the build naming every demo that
 * threw. It reports all of them in one run rather than stopping at the first.
 *
 * Two things keep it from passing vacuously:
 *  - the demo list comes from the app's own registry (the `_demo` index), not
 *    from a directory read here that could drift away from it;
 *  - each demo must put something in the frame. A demo that rendered nothing
 *    would otherwise throw nothing and "pass".
 *
 * Mutation-tested: breaking one demo turns this red naming that demo.
 */

const ROOT = join(import.meta.dir, '..')

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

// Ask the OS for a free port, then let Vite preview serve the built app — the
// same production bundle a visitor gets, so a failure that only appears after
// the React Compiler and minification have run is still caught.
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

const browser = await chromium.launch({
  headless: true,
  // Playwright resolves its own pinned Chromium build, which a machine whose
  // browser cache predates the last `playwright` bump will not have. Point at
  // a system Chrome to run this locally without re-downloading one.
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
})
const context = await browser.newContext()

interface DemoFailure {
  name: string
  reason: string
}
const failures: DemoFailure[] = []

try {
  const indexPage = await context.newPage()
  await indexPage.goto(`${origin}/developers/docs/bloom/_demo`, { waitUntil: 'load' })
  await indexPage.locator('[data-demo-index]').waitFor()
  const names = await indexPage.evaluate(() =>
    [...document.querySelectorAll('[data-demo-name]')].map(
      (node) => node.getAttribute('data-demo-name') ?? '',
    ),
  )
  await indexPage.close()

  invariant(names.length > 0, 'the demo registry reported no demos — this check would pass vacuously')
  invariant(names.every(Boolean), 'the demo index emitted an empty name')

  for (const name of names) {
    // A fresh page per demo: an uncaught render error tears down the React
    // root, so a reused page would carry one demo's wreckage into the next.
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    try {
      await page.goto(`${origin}/developers/docs/bloom/_demo/${name}`, { waitUntil: 'load' })
      await page.locator('[data-demo-root]').waitFor({ timeout: 15_000 })
      const missing = await page.locator('[data-demo-missing]').count()
      if (missing > 0) {
        failures.push({ name, reason: 'the registry has no demo under this name' })
        continue
      }
      // The demo mounts through `React.lazy`, so an empty frame right after
      // load only means it has not arrived yet.
      await page
        .locator('[data-demo-frame] > *')
        .first()
        .waitFor({ timeout: 15_000 })
        .catch(() => undefined)
      const rendered = await page.evaluate(
        () => document.querySelector('[data-demo-frame]')?.childElementCount ?? 0,
      )
      if (errors.length > 0) {
        failures.push({ name, reason: errors.join('; ') })
      } else if (rendered === 0) {
        failures.push({ name, reason: 'rendered nothing' })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.split('\n')[0] : String(error)
      failures.push({ name, reason: errors.join('; ') || message })
    } finally {
      await page.close()
    }
  }

  if (failures.length > 0) {
    const report = failures.map((failure) => `  ${failure.name}: ${failure.reason}`).join('\n')
    throw new Error(`${failures.length} of ${names.length} Bloom demos failed to render:\n${report}`)
  }
  console.log(`[bloom-demos] ${names.length} demos rendered with no errors`)
} finally {
  await context.close()
  await browser.close()
  preview.kill()
  await preview.exited
}
