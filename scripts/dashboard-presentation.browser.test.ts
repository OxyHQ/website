import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = process.env.DASHBOARD_TEST_BASE_URL ?? 'http://127.0.0.1:5174';
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--disable-features=LocalNetworkAccessChecks'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new Error('Native fullscreen denied for test'));
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(baseURL).origin || url.protocol === 'data:') return route.continue();
    return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
  });
  await page.goto(`${baseURL}/dashboard/?fullscreen=true&fullscreenLayout=false&widgetRows=2`, { waitUntil: 'domcontentloaded' });
  const dashboard = page.locator('[data-dashboard-fullscreen]');
  await dashboard.waitFor({ timeout: 60_000 });
  assert.equal(await dashboard.getAttribute('data-dashboard-fullscreen'), 'true');
  assert.equal(await dashboard.getAttribute('data-fullscreen-layout'), 'false');
  assert.equal(await page.locator('.dashboard-metric').count(), 10);
  assert.equal(await page.evaluate(() => document.fullscreenElement), null);
  assert.equal(Math.round((await dashboard.boundingBox())!.height), 1080);
  const normalWidth = (await page.locator('.dashboard-metric').first().boundingBox())!.width;
  await page.screenshot({ path: '/tmp/oxy-dashboard-fullscreen-two-rows.png' });
  await page.getByRole('button', { name: /exit full/i }).click();
  await page.waitForFunction(() => document.querySelector('[data-dashboard-fullscreen]')?.getAttribute('data-dashboard-fullscreen') === 'false');
  assert.equal(await dashboard.getAttribute('data-dashboard-fullscreen'), 'false');
  assert.equal(new URL(page.url()).searchParams.has('fullscreen'), false);
  const regularWidth = (await page.locator('.dashboard-metric').first().boundingBox())!.width;
  assert.ok(Math.abs(normalWidth - regularWidth) < 1, 'fullscreenLayout=false keeps normal widget scale');
  await page.getByRole('button', { name: /enter full/i }).click();
  await page.waitForFunction(() => document.querySelector('[data-dashboard-fullscreen]')?.getAttribute('data-dashboard-fullscreen') === 'true');
  assert.equal(await page.evaluate(() => document.fullscreenElement), null);
  await page.goto(`${baseURL}/dashboard/?fullscreen=true`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-widget-rows="1"]').waitFor({ timeout: 60_000 });
  assert.equal(await page.locator('.dashboard-metric').count(), 5);
  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.goto(`${baseURL}/dashboard/?fullscreen=true&fullscreenLayout=false&widgetRows=2`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-widget-rows="2"]').waitFor({ timeout: 60_000 });
  assert.equal(await page.locator('.dashboard-metric').count(), 10);
  for (const widget of await page.locator('.dashboard-metric').all()) {
    const bounds = (await widget.boundingBox())!;
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 2160, 'every TV widget fits the viewport');
  }
  const tvWidth = (await page.locator('.dashboard-metric').first().boundingBox())!.width;
  assert.equal(await dashboard.evaluate(el => el.scrollHeight <= el.clientHeight), true, 'no vertical TV overflow');
  await page.screenshot({ path: '/tmp/oxy-dashboard-tv-two-rows.png' });
  await page.getByRole('button', { name: /exit full/i }).click();
  await page.waitForFunction(() => document.querySelector('[data-dashboard-fullscreen]')?.getAttribute('data-dashboard-fullscreen') === 'false');
  assert.ok(Math.abs(tvWidth - (await page.locator('.dashboard-metric').first().boundingBox())!.width) < 1);
  await page.goto(`${baseURL}/dashboard/?fullscreen=true&fullscreenLayout=false&widgetRows=2&hideControls=true`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-widget-rows="2"]').waitFor({ timeout: 60_000 });
  assert.equal(await dashboard.locator('header button').count(), 0, 'both map and fullscreen controls are hidden');
  assert.equal(await page.locator('.dashboard-metric').count(), 10);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('[data-dashboard-fullscreen]')?.getAttribute('data-dashboard-fullscreen') === 'false');
  assert.equal(new URL(page.url()).searchParams.get('hideControls'), 'true');
  assert.equal(await dashboard.locator('header button').count(), 0);
  await page.goto(`${baseURL}/dashboard/?hideControls=false`, { waitUntil: 'domcontentloaded' });
  await dashboard.waitFor();
  assert.equal(await dashboard.locator('header button').count(), 2, 'controls remain visible by default');
  console.log('PASS: URL fullscreen without browser permission, independent normal scale/two rows, exit and denied native fallback');
} finally {
  await browser.close();
}
