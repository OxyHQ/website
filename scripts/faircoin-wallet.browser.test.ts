/** FAIRCOIN_TEST_ORIGIN=http://localhost:5173 bun scripts/faircoin-wallet.browser.test.ts */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const origin = process.env.FAIRCOIN_TEST_ORIGIN || 'http://localhost:5173';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
});
const page = await browser.newPage();
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.route('**/api/price', (route) =>
  route.fulfill({
    json: { price: 0.49, change24h: 0, source: 'wfair-base', updatedAt: '2026-10-23T00:00:00Z' },
  }),
);
await page.route('**/api/stats?network=mainnet', (route) =>
  route.fulfill({ json: { stats: { blockHeight: 206160, circulatingSupply: 7061600 } } }),
);
try {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 1024 ? 844 : 1000 });
    await page.goto(`${origin}/faircoin/wallet/`);
    await page.locator('[data-wallet-landing]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.evaluate(() => {
      const heroElement = document.querySelector('#wallet-title');
      const headerElement = document.querySelector('header');
      if (!heroElement || !headerElement) throw new Error('Missing hero or header');
      const hero = heroElement.getBoundingClientRect();
      const heroImage = heroElement.closest('section')?.querySelector('img');
      if (!heroImage) throw new Error('Missing hero image');
      const header = headerElement.getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        heroTop: hero.top,
        heroMediaBottom: heroImage.getBoundingClientRect().bottom,
        headerBottom: header.bottom,
        headerBackground: getComputedStyle(headerElement).backgroundColor,
        features: [...document.querySelectorAll<HTMLElement>('[data-wallet-feature]')].map(
          (section) => {
            const mediaElement = section.querySelector('[data-wallet-scene]');
            const textElement = section.querySelector('h2');
            if (!mediaElement || !textElement) throw new Error('Missing feature media or text');
            const media = mediaElement.getBoundingClientRect();
            const text = textElement.getBoundingClientRect();
            return {
              x: media.x,
              y: media.y,
              w: media.width,
              h: media.height,
              textX: text.x,
              textY: text.y,
            };
          },
        ),
      };
    });
    assert(!geometry.overflow, `${width}: horizontal overflow`);
    assert(
      geometry.heroTop >= geometry.headerBottom + 24,
      `${width}: hero needs breathing room below the header`,
    );
    assert.equal(geometry.headerBackground, 'rgba(0, 0, 0, 0)');
    assert.equal(geometry.features.length, 5);
    for (const [index, media] of geometry.features.entries()) {
      assert(
        Math.abs(media.w / media.h - (width < 1024 ? 1 : 1.3187)) < 0.002,
        `${width}: media ratio ${index}`,
      );
      if (width < 1024) {
        assert(media.textY < media.y, 'Mobile copy must precede media');
        assert(
          index % 2 ? media.x < 10 : media.x > width * 0.18,
          'Mobile rows must alternate edges',
        );
      } else {
        assert(
          index % 2 ? media.x < media.textX : media.x > media.textX,
          'Desktop text/media alternate',
        );
      }
    }
    if (width === 1440) {
      const first = geometry.features[0];
      assert(first);
      assert(
        Math.abs(first.x - 614) < 3 && Math.abs(first.y - geometry.heroMediaBottom - 587) < 8,
        'Reference desktop composition drifted',
      );
    }
    const faq = page.getByRole('button', {
      name: 'How do I send FairCoin with FAIRWallet?',
      exact: true,
    });
    await faq.scrollIntoViewIfNeeded();
    await faq.click();
    assert.equal(await faq.getAttribute('aria-expanded'), 'true');
    await page.getByText('Open your wallet and choose Send.', { exact: false }).waitFor();
    await faq.press('Enter');
    assert.equal(await faq.getAttribute('aria-expanded'), 'false');
    const link = page.getByRole('link', { name: /^Explore FairCoin/ });
    assert.equal(await link.count(), 1);
    assert.equal(await link.getAttribute('href'), '/faircoin/');
    if (width < 1024) {
      const download = page.getByRole('link', { name: 'Download FAIRWallet', exact: true });
      assert(await download.isVisible());
      assert((await download.getAttribute('href'))?.endsWith('/FAIRWallet/releases/latest'));
      const contrast = await download.evaluate((el) => ({
        color: getComputedStyle(el).color,
        bg: getComputedStyle(el.parentElement || el).backgroundColor,
      }));
      assert.notEqual(contrast.color, contrast.bg, 'Download label must contrast with its surface');
    }
    assert.equal(await page.locator('footer').count(), 1);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const media = page.locator('[data-wallet-scene="send"]');
  await media.scrollIntoViewIfNeeded();
  const styleSnapshot = () =>
    media.evaluate((el) =>
      [...el.querySelectorAll<HTMLElement>('[style]')]
        .map((node) => node.style.transform)
        .join('|'),
    );
  await page.getByRole('button', { name: 'Pause send animation' }).click();
  await page.waitForTimeout(100);
  const stopped = await styleSnapshot();
  await page.waitForTimeout(350);
  assert.equal(await styleSnapshot(), stopped, 'Pause must freeze media');
  await page.getByRole('button', { name: 'Play send animation' }).click();
  await page.waitForFunction(
    (before) =>
      [...document.querySelectorAll<HTMLElement>('[data-wallet-scene="send"] [style]')]
        .map((node) => node.style.transform)
        .join('|') !== before,
    stopped,
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(150);
  assert.equal(await media.locator('button').count(), 0, 'Reduced motion disables autoplay');
  const reduced = await styleSnapshot();
  await page.waitForTimeout(350);
  assert.equal(await styleSnapshot(), reduced, 'Reduced motion must remain static');
  assert.equal(
    await page.locator('#wallet-download').getByText('$0.49', { exact: true }).count(),
    1,
  );
  assert.equal(
    await page.locator('#wallet-download').getByText('0.00% · 24h', { exact: true }).count(),
    1,
  );
  await page.unroute('**/api/price');
  await page.route('**/api/price', (route) => route.fulfill({ json: { price: null } }));
  await page.goto(`${origin}/faircoin/wallet/`);
  await page.locator('#wallet-download').getByText('Unavailable', { exact: true }).waitFor();
  assert(
    !/\$0\.00|NaN/.test(await page.locator('#wallet-download').innerText()),
    'Unavailable price must not become zero',
  );
  assert.deepEqual(errors, []);
  console.log(
    'PASS: wallet reference geometry at 6 widths, transparent chrome, FAQ keyboard controls, links, pause/resume, reduced motion and price states.',
  );
} finally {
  await browser.close();
}
