import { chromium } from 'playwright';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { basename, join } from 'node:path';
import assert from 'node:assert/strict';

const baseURL = process.env.DASHBOARD_TEST_BASE_URL ?? 'http://127.0.0.1:5177';
const fixture = await mkdtemp(join(process.cwd(), '.camera-fixture-'));
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
try {
  await writeFile(join(fixture, 'index.html'), '<div id="root"></div><script type="module" src="./entry.tsx"></script>');
  await writeFile(join(fixture, 'entry.tsx'), `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import LiveGlobe from '../src/components/dashboard/LiveGlobe';
    import '../src/index.css';
    function Fixture() {
      const [events, setEvents] = React.useState([]);
      window.setCameraEvents = setEvents;
      return <div style={{ width: '100vw', height: '100vh' }}><LiveGlobe activityEvents={events} /></div>;
    }
    createRoot(document.getElementById('root')).render(<Fixture />);
  `);
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  await page.addInitScript(() => { (window as any).__cameraFrames = []; });
  await page.route('**/src/components/dashboard/LiveGlobe.tsx*', async route => {
    const response = await route.fetch();
    let source = await response.text();
    source = source.replace('globe.pointOfView(next, 0)', '(window.__cameraFrames.push({t: performance.now(), ...next}), globe.pointOfView(next, 0))');
    source = source.replace('const globe = globeRef.current;', 'const globe = globeRef.current; window.__testGlobe = globe;');
    await route.fulfill({ response, body: source });
  });
  await page.goto(`${baseURL}/${basename(fixture)}/index.html`);
  await page.waitForFunction(() => (window as any).__cameraFrames.length > 20, { timeout: 60_000 });
  await page.evaluate(() => {
    (window as any).setCameraEvents([{ service: 'mention', region: 'us-east-1', sourceRegion: 'edge-mad', sourceCoordinates: [150, -35], requests: 100, activityType: 'api', scope: 'external', direction: 'inbound', emittedAt: new Date().toISOString() }]);
  });
  await page.waitForTimeout(1_000);
  assert.equal(await page.evaluate(() => (window as any).__testGlobe.controls().autoRotate), false);
  const frames = await page.evaluate(() => (window as any).__cameraFrames);
  for (let i = 1; i < frames.length; i++) {
    const dt = Math.min(0.1, (frames[i].t - frames[i - 1].t) / 1_000);
    const distance = Math.hypot(frames[i].lat - frames[i - 1].lat, ((frames[i].lng - frames[i - 1].lng + 540) % 360) - 180);
    assert.ok(distance <= 12 * dt + 0.03, 'camera stays below angular speed bound');
    assert.ok(Math.abs(frames[i].altitude - 1.7) < 1e-10, 'altitude remains constant');
  }
  const canvas = page.locator('canvas').first();
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 140, bounds.y + bounds.height / 2 + 30, { steps: 8 });
  const during = await page.evaluate(() => (window as any).__cameraFrames.length);
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => (window as any).__cameraFrames.length), during, 'automatic camera yields to drag');
  await page.mouse.up();
  const released = await page.evaluate(() => (window as any).__cameraFrames.length);
  await page.waitForTimeout(1_800);
  assert.equal(await page.evaluate(() => (window as any).__cameraFrames.length), released, 'manual view remains still for two seconds');
  await page.waitForFunction((count) => (window as any).__cameraFrames.length > count, released);
  console.log('PASS: real globe uses one bounded camera loop, constant altitude and manual drag + two-second pause');
} finally {
  await browser.close();
  await rm(fixture, { recursive: true, force: true });
}
