import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const baseURL = process.env.DASHBOARD_TEST_BASE_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--disable-features=LocalNetworkAccessChecks'] })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } })
  const errors: string[] = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message) })
  await page.route('**/src/components/dashboard/LiveGlobe.tsx*', async route => {
    const response = await route.fetch()
    const source = (await response.text()).replace('const globe = globeRef.current;', 'const globe = globeRef.current; window.__testGlobe = globe;').replace('retainFlowObjects(arcCacheRef.current, nextArcs)', '(window.__testArcs = retainFlowObjects(arcCacheRef.current, nextArcs))')
    await route.fulfill({ response, body: source })
  })
  await page.route('**/__activity-test', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type; window.__vite_plugin_react_preamble_installed__ = true;</script><script type="module">import "/@vite/client"; import "/scripts/fixtures/activity-map.tsx";</script></body></html>' }))
  await page.goto(`${baseURL}/__activity-test`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.getByRole('button', { name: 'Toggle map' }).click()
  await page.waitForFunction(() => {
    let ready = false
    ;(window as any).__testGlobe?.scene().traverse((object: any) => {
      const uniforms = object.material?.uniforms
      if (uniforms?.dayImage?.value.image?.width && uniforms?.nightImage?.value.image?.width) ready = true
    })
    return ready
  })
  await page.evaluate(() => {
    const globe = (window as any).__testGlobe
    globe.controls().dispatchEvent({ type: 'start' })
    globe.pointOfView({ lat: 0, lng: 0, altitude: 1.7 }, 0)
  })
  for (const hour of ['00', '06', '12', '18']) {
    await page.clock.setFixedTime(new Date(`2026-03-20T${hour}:00:00Z`))
    await page.waitForTimeout(150)
    const sun = await page.evaluate(() => {
      let result: number[] = []
      ;(window as any).__testGlobe.scene().traverse((object: any) => {
        if (object.material?.uniforms?.sun) result = object.material.uniforms.sun.value.toArray()
      })
      return result
    })
    assert.equal(sun.length, 3)
    assert.ok(Math.abs(Math.hypot(...sun) - 1) < 1e-10)
    if (hour === '12') assert.ok(sun[2] > 0.99)
    if (hour === '00') assert.ok(sun[2] < -0.99)
    if (hour === '06') assert.ok(sun[0] > 0.99)
    if (hour === '18') assert.ok(sun[0] < -0.99)
    await page.screenshot({ path: `/tmp/oxy-solar-${hour}.png` })
  }
  assert.deepEqual(errors, [])
  console.log('PASS: solar textures, live UTC uniform updates and four times render without WebGL errors')
} finally { await browser.close() }
