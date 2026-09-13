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
    assert.equal(await path.getAttribute('stroke'), 'var(--map-internal)')
    assert.equal(await path.getAttribute('stroke-width'), '2')
  }
  for (const theme of ['dark', 'light']) {
    if (theme === 'light') { await page.getByRole('button', { name: 'Toggle theme' }).click(); await page.waitForTimeout(200) }
    const colors = await page.evaluate(() => [...document.querySelectorAll('[data-traffic-scope="internal"] > path:first-child, [data-internal-legend]')].map(node => { const style = getComputedStyle(node); return node.hasAttribute('data-internal-legend') ? style.borderTopColor : style.stroke }))
    assert.equal(colors.length, 3)
    for (const color of colors) assert.ok(Math.min(...color.match(/[\d.]+/g)!.slice(0, 3).map(Number)) > 180, `${theme} keeps the internal route/legend bright on the night map`)
  }
  assert.equal(await page.locator('[data-traffic-pulse]').count(), 4, 'one train per observed flow')
  await page.evaluate(() => {
    (window as any).__pulseAnimations = [...document.querySelectorAll('[data-traffic-pulse]')].map(node => node.getAnimations()[0])
  })
  await page.getByRole('button', { name: 'Next bucket' }).click()
  await page.waitForTimeout(200)
  assert.equal(await page.locator('[data-traffic-direction]').count(), 4, 'buckets consolidate into persistent flows')
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('[data-traffic-pulse]')].every((node, index) => node.getAnimations()[0] === (window as any).__pulseAnimations[index])), true, '2D animations survive new batches')
  await page.screenshot({ path: '/tmp/oxy-activity-flat.png' })
  await page.getByRole('button', { name: 'Toggle map' }).click()
  await page.locator('canvas').waitFor({ state: 'attached', timeout: 60_000 })
  await page.waitForFunction(() => performance.getEntriesByType('resource').some(entry => entry.name.includes('/images/dashboard/earth-night-nasa') && entry.duration > 0), undefined, { timeout: 60_000 })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await page.waitForFunction(() => {
    let count = 0
    ;(window as any).__testGlobe?.scene().traverse((object: any) => { if (object.__globeObjType === 'arc' && object.children.length) count++ })
    return count === 6
  })
  await page.evaluate(() => {
    const arcs: any[] = []
    ;(window as any).__testGlobe.scene().traverse((object: any) => { if (object.__globeObjType === 'arc') arcs.push(object.children[0]) })
    ;(window as any).__arcSnapshot = arcs.map(object => ({ uuid: object.uuid, phase: object.material.uniforms.dashTranslate.value, moving: object.__dashAnimateStep > 0 }))
  })
  await page.getByRole('button', { name: 'Next bucket' }).click()
  await page.waitForTimeout(300)
  assert.equal(await page.evaluate(() => {
    const arcs: any[] = []
    ;(window as any).__testGlobe.scene().traverse((object: any) => { if (object.__globeObjType === 'arc') arcs.push(object.children[0]) })
    return arcs.length === 6 && (window as any).__arcSnapshot.every((previous: any) => {
      const object = arcs.find(object => object.uuid === previous.uuid)
      return object && (!previous.moving || object.material.uniforms.dashTranslate.value > previous.phase)
    })
  }), true, '3D objects and running phases survive new batches')
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') { await page.getByRole('button', { name: 'Toggle theme' }).click(); await page.waitForTimeout(200) }
    assert.equal(await page.evaluate(() => {
      const colors: string[] = []
      ;(window as any).__testArcs.forEach((arc: any) => { if (arc.id.endsWith('-internal-track')) colors.push(arc.color) })
      return colors.length === 2 && colors.every(color => Math.min(...color.match(/[\d.]+/g)!.slice(0, 3).map(Number)) > 180)
    }), true, `${theme} keeps 3D internal backbones bright`)
  }
  await page.screenshot({ path: '/tmp/oxy-activity-globe.png' })
  assert.deepEqual(errors, [])
  console.log('PASS: 2D/3D directions, persistent phases across batches, bounded geometry, light/dark internal contrast')
} finally {
  await browser.close()
}
