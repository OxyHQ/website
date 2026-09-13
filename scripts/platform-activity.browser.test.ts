import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const baseURL = process.env.DASHBOARD_TEST_BASE_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--disable-features=LocalNetworkAccessChecks'] })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } })
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message) })
  await page.route('**/__activity-test', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module">import "/@vite/client"; import "/scripts/fixtures/activity-map.tsx";</script></body></html>' }))
  await page.goto(`${baseURL}/__activity-test`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.locator('[data-traffic-direction]').first().waitFor({ state: 'attached', timeout: 60_000 })
  assert.equal(await page.locator('[data-traffic-direction]').count(), 4)
  assert.equal(await page.locator('[data-traffic-direction="inbound"]').count(), 2)
  assert.equal(await page.locator('[data-traffic-direction="outbound"]').count(), 2)
  assert.equal(await page.locator('[data-traffic-type="media"]').count(), 2)
  const internal = page.locator('[data-traffic-scope="internal"]')
  assert.equal(await internal.count(), 2)
  for (const group of await internal.all()) {
    const path = group.locator('path').first()
    assert.match((await path.getAttribute('d'))!, / c /)
    assert.equal(await path.getAttribute('stroke-dasharray'), '3 3')
  }
  await page.screenshot({ path: '/tmp/oxy-activity-flat.png' })
  await page.getByRole('button', { name: 'Toggle map' }).click()
  await page.locator('canvas').waitFor({ state: 'attached', timeout: 60_000 })
  await page.screenshot({ path: '/tmp/oxy-activity-globe.png' })
  assert.deepEqual(errors, [])
  console.log('PASS: 2D directions, media classification, internal local loops, 3D rendering')
} finally {
  await browser.close()
}
