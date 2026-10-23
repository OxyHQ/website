/** Full-cycle regression: FAIRCOIN_TEST_ORIGIN=http://localhost:5173 bun scripts/faircoin-wallet-motion.browser.test.ts */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.FAIRCOIN_TEST_ORIGIN || 'http://localhost:5173';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
});
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width < 1024 ? 844 : 1000 } });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.goto(`${origin}/faircoin/wallet/`);
    await page.locator('[data-wallet-landing]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));

    const pockets = page.locator('[data-wallet-scene="pockets"]');
    await pockets.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-wallet-scene="pockets"]')?.getAttribute('data-paused') ===
        'false',
    );
    await page.clock.runFor(7500);
    const completion = await pockets.evaluate((el) => {
      const opacity = (selector: string) => {
        const target = el.querySelector(selector);
        if (!target) throw new Error(`Missing ${selector}`);
        return getComputedStyle(target).opacity;
      };
      return {
        balance: opacity('[data-pocket-balance]'),
        background: opacity('[data-pocket-completion]'),
        portraits: [...el.querySelectorAll('[data-pocket-portrait]')].map((portrait) => {
          const rect = portrait.getBoundingClientRect();
          return {
            opacity: Number(getComputedStyle(portrait).opacity),
            w: rect.width,
            h: rect.height,
          };
        }),
      };
    });
    assert.equal(
      completion.balance,
      '0',
      `${width}: completion must replace the amount, not cover it`,
    );
    assert.equal(completion.background, '1', `${width}: completion needs its own dark scene`);
    assert.equal(completion.portraits.filter((portrait) => portrait.opacity > 0.9).length, 9);
    for (const portrait of completion.portraits) {
      assert(Math.abs(portrait.w - portrait.h) < 0.1, `${width}: portrait must stay circular`);
    }
    const cluster = pockets.locator('[data-pocket-portraits]');
    const expandedCluster = await cluster.boundingBox();
    assert(expandedCluster);
    await page.clock.runFor(2400);
    assert.equal(
      await pockets.locator('[data-pocket-balance]').evaluate((el) => getComputedStyle(el).opacity),
      '0',
      'Do not unwind a full arc underneath a visible 500 balance',
    );
    const contractingCluster = await cluster.boundingBox();
    assert(contractingCluster);
    assert(
      contractingCluster.width > 0 && contractingCluster.width < expandedCluster.width * 0.8,
      `${width}: outro must contract the whole cluster, not shrink portraits at fixed positions`,
    );
    assert(
      Math.abs(
        contractingCluster.x +
          contractingCluster.width / 2 -
          (expandedCluster.x + expandedCluster.width / 2),
      ) < 1 &&
        Math.abs(
          contractingCluster.y +
            contractingCluster.height / 2 -
            (expandedCluster.y + expandedCluster.height / 2),
        ) <
          expandedCluster.height * 0.03,
      `${width}: cluster outro must converge near its center`,
    );
    await page.clock.runFor(600);
    assert.equal(
      await pockets.locator('[data-pocket-balance]').evaluate((el) => getComputedStyle(el).opacity),
      '1',
    );
    assert.match(
      await pockets.locator('[data-pocket-balance]').innerText(),
      /⊜125/,
      'Next cycle starts with its initial amount',
    );

    const review = page.locator('[data-wallet-scene="review"]');
    await review.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-wallet-scene="review"]')?.getAttribute('data-paused') ===
        'false',
    );
    // Sample transitions and wraparound, not just the four held positions.
    let previousNotices: { opacity: number; y: number }[] | undefined;
    let foregroundSamples = 0;
    for (let frame = 0; frame < 132; frame++) {
      await page.clock.runFor(32);
      const sample = await review.evaluate((el) => {
        const scene = el.getBoundingClientRect();
        const notices = [...el.querySelectorAll('[data-payment-notice]')].map((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            opacity: Number(style.opacity),
            layer: Number(style.zIndex),
            top: (rect.top - scene.top) / scene.height,
            y: rect.top - scene.top,
          };
        });
        return {
          width: scene.width,
          notices,
          front: notices
            .filter((card) => card.top > 0.3 && card.top < 0.5)
            .sort((a, b) => b.layer - a.layer)[0],
        };
      });
      const { front, notices } = sample;
      if (front) {
        foregroundSamples++;
        assert(
          front.opacity > 0.99,
          `${width}: foreground notification at frame ${frame} must hide text behind it`,
        );
      }
      for (const [index, card] of notices.entries()) {
        const previous = previousNotices?.[index];
        if (previous && Math.abs(card.y - previous.y) > sample.width * 0.15) {
          assert(
            previous.opacity < 0.02 && card.opacity < 0.02,
            `${width}: notification ${index} visibly teleported at frame ${frame}`,
          );
        }
      }
      previousNotices = notices;
    }
    assert(
      foregroundSamples > 60,
      `${width}: foreground opacity check must observe the actual stack`,
    );

    const bridge = page.locator('[data-wallet-scene="bridge"]');
    await bridge.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-wallet-scene="bridge"]')?.getAttribute('data-paused') ===
        'false',
    );
    await page.clock.runFor(100);
    const cards = () =>
      bridge.locator('[data-bridge-card]').evaluateAll((els) =>
        els.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            w: rect.width,
            h: rect.height,
            transform: getComputedStyle(el).transform,
          };
        }),
      );
    const start = await cards();
    const sceneBounds = await bridge.boundingBox();
    assert(sceneBounds);
    const sceneCenter = sceneBounds.y + sceneBounds.height / 2;
    const centralCard = start
      .map((card, index) => ({ ...card, index }))
      .filter((card) => Math.abs(card.y + card.h / 2 - sceneCenter) < sceneBounds.height * 0.2)
      .sort((a, b) => b.w * b.h - a.w * a.h)[0];
    assert(centralCard, `${width}: a front card must be visible near the scene center`);
    // Follow the largest central face briefly, before it can wrap outside the crop.
    await page.clock.runFor(400);
    const advancing = await cards();
    const nextCard = advancing[centralCard.index];
    const upwardTravel =
      (centralCard.y + centralCard.h / 2 - (nextCard.y + nextCard.h / 2)) / sceneBounds.height;
    assert(
      upwardTravel > 0.07 && upwardTravel < 0.13,
      `${width}: central card must move upward at the source cadence; moved ${upwardTravel}`,
    );
    await page.clock.runFor(2100);
    const middle = await cards();
    assert(
      middle.some((card) => card.transform.startsWith('matrix3d(')),
      'Cards must turn in perspective',
    );
    assert(
      middle.some((card, index) => Math.abs(card.y - start[index].y) > 20),
      'Cards must move through the scene',
    );
    await page.clock.runFor(2500);
    const end = await cards();
    for (const [index, card] of end.entries()) {
      assert(
        Math.abs(card.y - start[index].y) < 5,
        `${width}: card ${index} must loop at the same position`,
      );
    }

    // This scene moves continuously, so a stopped frame cannot pass by landing
    // on one of the long static holds in the payment or pockets sequences.
    const frameSnapshot = () =>
      bridge.evaluate((el) =>
        [...el.querySelectorAll('[style]')].map((node) => node.getAttribute('style')).join('|'),
      );
    await bridge.getByRole('button', { name: 'Pause bridge animation', exact: true }).click();
    await page.clock.runFor(32);
    const paused = await frameSnapshot();
    await page.clock.runFor(2000);
    assert.equal(await frameSnapshot(), paused, `${width}: Pause must preserve the current frame`);
    await bridge.getByRole('button', { name: 'Play bridge animation', exact: true }).click();
    assert.equal(await frameSnapshot(), paused, `${width}: Play must not rewind the scene`);
    await page.clock.runFor(160);
    assert.notEqual(await frameSnapshot(), paused, `${width}: Play must resume movement`);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(
      () =>
        document.querySelector('[data-wallet-scene="bridge"]')?.getAttribute('data-paused') ===
        'true',
    );
    // Flush the last scheduled paint after the visibility effect pauses its clock.
    await page.clock.runFor(32);
    const offscreen = await frameSnapshot();
    await page.clock.runFor(2500);
    assert.equal(await frameSnapshot(), offscreen, `${width}: hidden scene must stop its clock`);
    await bridge.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-wallet-scene="bridge"]')?.getAttribute('data-paused') ===
        'false',
    );
    assert.equal(
      await frameSnapshot(),
      offscreen,
      `${width}: re-entering must not reset the scene`,
    );
    await page.clock.runFor(160);
    assert.notEqual(await frameSnapshot(), offscreen, `${width}: re-entering must resume movement`);

    const send = page.locator('[data-wallet-scene="send"]');
    await send.scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-wallet-scene="send"]')?.getAttribute('data-paused') ===
        'false',
    );
    await page.clock.runFor(11500);
    assert.equal(
      await send.locator('[data-send-complete]').evaluate((el) => getComputedStyle(el).opacity),
      '1',
      'Payment flow must reach its completion state',
    );
    await page.clock.runFor(8000);
    assert.match(
      await send.innerText(),
      /⊜0/,
      'Payment amount resets after its sheet is dismissed',
    );

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.runFor(100);
    const frozen = await send.innerHTML();
    await page.clock.runFor(3000);
    assert.equal(await send.innerHTML(), frozen, 'Reduced motion must stop the whole timeline');
    assert.equal(await send.locator('button').count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    'PASS: complete wallet cycles at desktop/mobile; balance/portrait handoff, circular avatars, opaque notification transitions and hidden wraps, perspective card loops, pause/offscreen continuity and live reduced motion.',
  );
} finally {
  await browser.close();
}
