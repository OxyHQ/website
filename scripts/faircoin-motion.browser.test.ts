/** Run against the local website: FAIRCOIN_TEST_ORIGIN=http://localhost:5173 bun scripts/faircoin-motion.browser.test.ts */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.FAIRCOIN_TEST_ORIGIN || 'http://localhost:5173';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
const scroll = async (y: number) => {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
  await page.waitForTimeout(100);
};
const settledAt = (y: number) => page.waitForFunction((top) => Math.abs(scrollY - top) < 1, y);
try {
  await page.goto(`${origin}/faircoin/#top`);
  await page.waitForFunction(() => {
    const phone = document.querySelector('#wallet [data-scroll-phone]');
    return phone && getComputedStyle(phone).position === 'fixed';
  });
  await page.mouse.move(1000, 600);
  await page.mouse.wheel(0, 150);
  await page.waitForTimeout(250);
  const moving = await page.evaluate(() => scrollY);
  assert(
    moving > 0 && moving < 1000,
    'wheel must animate immediately, without native smooth-scroll delay',
  );
  await settledAt(1000);
  await page.waitForTimeout(100);
  await page.mouse.wheel(0, -150);
  await settledAt(0);
  await page.waitForTimeout(150);

  // Measured reference at scroll 800: the hero mask is still opaque and the
  // incoming phone reveals only its bottom 600px, at a fixed viewport position.
  await scroll(800);
  const frame = await page.evaluate(() => {
    const background = document.querySelector('[data-hero-background]');
    const phone = document.querySelector('#wallet [data-scroll-phone]');
    const mask = phone?.querySelector('[data-phone-mask]');
    if (!background || !phone || !mask) throw new Error('Missing landing media');
    return {
      size: getComputedStyle(background).maskSize,
      opacity: getComputedStyle(background).opacity,
      phoneTop: phone.getBoundingClientRect().top,
      mask: getComputedStyle(mask).maskPosition,
    };
  });
  assert.equal(frame.opacity, '1');
  assert(Math.abs(parseFloat(frame.size) - 845.6) < 1);
  assert.equal(frame.phoneTop, 100);
  assert.equal(frame.mask, '0px 200px');
  // The last green silhouette must dissolve, rather than switching off in one
  // frame when the magnetic scroll reaches the first chapter. Check both ways.
  await scroll(970);
  for (const top of [1000, 970]) {
    const fade = await page.evaluate(
      (target) =>
        new Promise<number[]>((resolve) => {
          const background = document.querySelector('[data-hero-background]');
          if (!background) throw new Error('Missing hero background');
          const values = [+getComputedStyle(background).opacity];
          const start = performance.now();
          window.scrollTo({ top: target, behavior: 'instant' });
          const sample = (time: number) => {
            values.push(+getComputedStyle(background).opacity);
            if (time - start > 350) resolve(values);
            else requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        }),
      top,
    );
    assert(
      fade.some((opacity) => opacity > 0 && opacity < 1),
      'hero mask must fade continuously',
    );
    assert.equal(fade.at(-1), top === 1000 ? 0 : 1);
  }
  await scroll(4600);
  assert.equal(
    await page
      .locator('#values [data-scroll-phone]')
      .evaluate((el) => getComputedStyle(el).opacity),
    '0.4',
  );
  assert.equal(
    await page
      .locator('#values [data-phone-mask]')
      .evaluate((el) => getComputedStyle(el).maskPosition),
    '0px 0px',
  );
  assert.equal(
    await page
      .locator('#pockets [data-phone-mask]')
      .evaluate((el) => getComputedStyle(el).maskPosition),
    '0px 400px',
  );
  await scroll(9000);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(300);
  assert(await page.evaluate(() => scrollY > 9000), 'footer must scroll freely');
  await scroll(9000);
  await page.mouse.wheel(0, -100);
  await settledAt(8000);
  await page.waitForTimeout(150);
  await scroll(0);
  await page.waitForTimeout(400);
  assert.equal(
    await page.evaluate(() => scrollY),
    0,
    'jumping to the top must not snap back to the footer',
  );

  for (const [width, height] of [
    [390, 844],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${origin}/faircoin/`);
    await page.getByRole('dialog', { name: 'Welcome to FairCoin' }).waitFor();
    await page.waitForFunction(() => {
      const phone = document.querySelector('[data-intro-phone]');
      return phone && getComputedStyle(phone).opacity === '1';
    });
    const morph = await page.evaluate(
      () =>
        new Promise<{ width: number; layoutWidth: number; screenOpacity: number }[]>((resolve) => {
          const frames: { width: number; layoutWidth: number; screenOpacity: number }[] = [];
          const start = performance.now();
          const sample = (time: number) => {
            const phone = document.querySelector<HTMLElement>('[data-intro-phone]');
            const screen = document.querySelector<HTMLElement>('[data-intro-screen]');
            if (!phone || !screen) return resolve(frames);
            frames.push({
              width: phone.getBoundingClientRect().width,
              layoutWidth: screen.clientWidth,
              screenOpacity: +getComputedStyle(screen).opacity,
            });
            if (time - start >= 1800) return resolve(frames);
            requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        }),
    );
    assert(
      morph[morph.length - 1].width > morph[0].width * 3,
      'the silhouette must expand into the hero',
    );
    assert(
      morph.every((frame) => frame.layoutWidth === morph[0].layoutWidth),
      'wallet layout must stay fixed while the silhouette scales',
    );
    assert.equal(
      morph[0].screenOpacity,
      1,
      'the last intro icon must show the wallet before it expands',
    );
    await page.waitForFunction(() => {
      const bg = document.querySelector('[data-intro-backdrop]');
      return bg && +getComputedStyle(bg).opacity < 0.8;
    });
    const distance = await page.evaluate(() => {
      const from = document.querySelector('[data-intro-phone]')?.getBoundingClientRect();
      const to = document
        .querySelector('[data-hero-device] [data-faircoin-phone]')
        ?.getBoundingClientRect();
      if (!from || !to) throw new Error('Missing intro morph destination');
      return Math.max(
        ...(['x', 'y', 'width', 'height'] as const).map((key) => Math.abs(from[key] - to[key])),
      );
    });
    assert(distance < 2, `intro must land on the actual phone at ${width}px`);
    // Sample the actual handoff, not just its endpoint: the hero used to become
    // visible under the fading overlay, then disappear and animate in again.
    const handoff = await page.evaluate(
      () =>
        new Promise<
          {
            opacity: number;
            y: number;
            intro: boolean;
          }[]
        >((resolve, reject) => {
          const frames: { opacity: number; y: number; intro: boolean }[] = [];
          const started = performance.now();
          let removedAt: number | undefined;
          const sample = (time: number) => {
            const copy = document.querySelector('[data-hero-copy]');
            if (!copy) return reject(new Error('Missing hero copy during intro handoff'));
            const intro = !!document.querySelector('[data-intro-backdrop]');
            frames.push({
              opacity: +getComputedStyle(copy).opacity,
              y: copy.getBoundingClientRect().y,
              intro,
            });
            if (!intro) removedAt ??= time;
            if (removedAt !== undefined && time - removedAt > 650) return resolve(frames);
            if (time - started > 3000) return reject(new Error('Intro did not complete'));
            requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        }),
    );
    assert(handoff.some((frame) => frame.intro) && handoff.some((frame) => !frame.intro));
    assert(
      handoff.every((frame) => frame.opacity === 1),
      `hero must not blink at ${width}px`,
    );
    assert(
      handoff.every((frame) => Math.abs(frame.y - handoff[0].y) < 1),
      `hero must not jump at ${width}px`,
    );
    await page.getByRole('dialog', { name: 'Welcome to FairCoin' }).waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(
      await page.locator('#wallet').getByText('Market', { exact: true }).count(),
      1,
      'the hidden first chapter must not cycle through its demo during the intro',
    );
    if (width === 1440) {
      await page.mouse.move(1000, 600);
      await page.mouse.wheel(0, 150);
      await settledAt(1000);
      await page.locator('#wallet').getByText('Today', { exact: true }).waitFor();
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.locator('h1').waitFor();
  assert.equal(await page.getByRole('dialog', { name: 'Welcome to FairCoin' }).count(), 0);
  await page.mouse.wheel(0, 150);
  await page.waitForTimeout(1200);
  assert.equal(await page.evaluate(() => scrollY), 150, 'reduced motion must use native scroll');
  assert.deepEqual(errors, []);
  console.log(
    'FairCoin: immediate magnetic scroll, reverse/free footer, measured masks, desktop/mobile intro and reduced motion passed.',
  );
} finally {
  await browser.close();
}
