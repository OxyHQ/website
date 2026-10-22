/** WEBSITE_TEST_ORIGIN=http://localhost:5173 bun scripts/horizon.browser.test.ts */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.WEBSITE_TEST_ORIGIN || 'http://localhost:5173';
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
});
const page = await browser.newPage({ reducedMotion: 'reduce' });
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));

try {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 1024 ? 844 : 1000 });
    await page.goto(`${origin}/horizon/`);
    const intro = page.getByRole('button', { name: 'Start exploring →', exact: true });
    await intro.waitFor();
    assert.equal(await page.locator('header').count(), 1);
    assert.equal(await page.locator('footer').count(), 1);
    assert.equal(
      await page.locator('header').evaluate((el) => getComputedStyle(el).backgroundColor),
      'rgba(0, 0, 0, 0)',
    );
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await intro.click();
    await page.getByRole('img', { name: 'Interactive map of Horizon', exact: true }).waitFor();

    if (width < 1024) {
      const next = page.getByRole('button', { name: 'Next area', exact: true });
      await next.click();
      assert(new URL(page.url()).hash.includes('sector=education'));
    } else {
      const education = page.getByRole('button', { name: 'Explore Education', exact: true });
      await education.focus();
      await education.press('Enter');
    }
    const learn = page.getByRole('button', { name: 'Explore Learn something new', exact: true });
    await learn.focus();
    await learn.press('Enter');
    await page.getByRole('heading', { name: 'Learn something new', exact: true }).waitFor();
    const academy = page.getByRole('link', { name: 'Oxy Academy', exact: true });
    assert.equal(await academy.getAttribute('href'), '/academy/');
    const card = await academy.evaluate((el) => {
      const icon = el.querySelector('span')?.getBoundingClientRect();
      const label = el.lastElementChild?.getBoundingClientRect();
      return icon && label ? { iconBottom: icon.bottom, labelTop: label.top } : null;
    });
    assert(card && card.labelTop > card.iconBottom, 'Product name must sit below its icon');
    await page.keyboard.press('Escape');
    assert(!new URL(page.url()).hash.includes('path='));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }

  // Selection must follow a real pointer drag before release, not only its snap.
  await page.goto(`${origin}/horizon/#sector=health`);
  const map = page.getByRole('img', { name: 'Interactive map of Horizon', exact: true });
  await map.waitFor();
  const box = await map.boundingBox();
  assert(box);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x + 300, y);
  await page.mouse.down();
  await page.mouse.move(x + 212, y + 212, { steps: 8 });
  await page.mouse.move(x, y + 300, { steps: 8 });
  assert(!new URL(page.url()).hash.includes('sector=health'), 'Selection must update during drag');
  await page.mouse.up();

  // The phone transition used to replace the intro in a single unanimated frame.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/horizon/`);
  await page.getByRole('button', { name: 'Start exploring →', exact: true }).click();
  await page.waitForFunction(() => {
    const map = document.querySelector('.horizon-wheel');
    if (!map?.parentElement) return false;
    const opacity = +getComputedStyle(map.parentElement).opacity;
    return opacity > 0 && opacity < 1;
  });
  await page.getByRole('button', { name: 'Next area', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: Horizon chrome, mobile exploration, keyboard details, icon grid, drag selection and animated mobile entry.',
  );
} finally {
  await browser.close();
}
