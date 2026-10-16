/**
 * The "Report content / rights claim" form against the built site, with the
 * Oxy API mocked at the network boundary: validation, the statements per kind,
 * the exact request body, and the success, 400, 429 and 5xx states — each of
 * the failures with the form still filled in.
 *
 * Runs in `postbuild`, like the other browser checks.
 */
import { chromium, type Request } from 'playwright';
import { strict as assert } from 'node:assert';

const OXY_API = (process.env.VITE_OXY_API || 'https://api.oxy.so').replace(/\/+$/, '');
const PATH = '/transparency/legal/report-content/';

const reserved = Bun.serve({ port: 0, fetch: () => new Response('reserved') });
const port = reserved.port;
reserved.stop(true);
const preview = process.env.TEST_ORIGIN
  ? undefined
  : Bun.spawn(
      [
        'bun',
        'x',
        'vite',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--strictPort',
      ],
      { stdout: 'ignore', stderr: 'ignore' },
    );
const origin = process.env.TEST_ORIGIN || `http://127.0.0.1:${port}`;
if (preview) {
  let ready = false;
  for (let attempt = 0; attempt < 50 && !ready; attempt++) {
    try {
      ready = (await fetch(origin)).ok;
    } catch {
      /* Preview is starting. */
    }
    if (!ready) await Bun.sleep(100);
  }
  if (!ready) {
    preview.kill();
    throw new Error('Vite preview did not start');
  }
}

type Mode = 'created' | 'invalid' | 'rate_limited' | 'failed';
let mode: Mode = 'failed';
const claims: Request[] = [];

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));

await context.route('**/*', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  if (`${url.origin}${url.pathname}` === `${OXY_API}/content-claims`) {
    if (request.method() === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'POST',
          'access-control-allow-headers': 'content-type, authorization, accept',
        },
      });
    }
    claims.push(request);
    const cors = { 'access-control-allow-origin': origin, 'access-control-expose-headers': '*' };
    switch (mode) {
      case 'created':
        return route.fulfill({
          status: 201,
          headers: cors,
          json: { id: 'claim_1', reference: 'OXY-CC-7Q2K' },
        });
      case 'invalid':
        return route.fulfill({
          status: 400,
          headers: cors,
          json: {
            error: 'Invalid claim',
            fields: { 'claimant.email': 'This address cannot receive mail' },
          },
        });
      case 'rate_limited':
        return route.fulfill({
          status: 429,
          headers: { ...cors, 'retry-after': '120' },
          json: { error: 'Too many requests' },
        });
      default:
        return route.fulfill({ status: 503, headers: cors, json: { error: 'Unavailable' } });
    }
  }
  if (url.origin !== origin) return route.abort();
  if (url.pathname.startsWith('/api/'))
    return route.fulfill({ status: 503, json: { error: 'Test: API unavailable' } });
  return route.continue();
});

// Bloom's field errors are alerts too; this is the summary above the form.
const alert = () => page.locator('[data-claim-summary]');
const submit = () => page.getByRole('button', { name: 'Submit report', exact: true }).click();
const goodFaith = () => page.getByRole('checkbox', { name: /good-faith belief/ });
const accurate = () => page.getByRole('checkbox', { name: /accurate/ });
const field = (label: string) => page.getByLabel(label, { exact: true }).first();

try {
  await page.goto(`${origin}${PATH}`);
  await page.getByRole('heading', { level: 1, name: 'Report content', exact: true }).waitFor();
  assert.equal(await page.locator('h1').count(), 1);

  // ── Nothing is sent until the form is valid; the summary takes focus ──
  await submit();
  await alert().getByText('Check these fields before you submit').waitFor();
  assert.equal(await alert().locator('li').count(), 9, 'Every required field is listed');
  assert.ok(
    await page.evaluate(() => document.activeElement?.hasAttribute('data-claim-summary')),
    'Focus moves to the error summary',
  );
  assert.equal(claims.length, 0, 'An invalid form must not reach the API');

  // ── The statements follow the kind ──
  await page.getByRole('radio', { name: /^Copyright/ }).click();
  await page.getByText(/^Under penalty of perjury/).waitFor();
  await field('Link to your original work (optional)').waitFor();
  await goodFaith().click();
  await accurate().click();
  await page.getByRole('radio', { name: /^Privacy or personal data/ }).click();
  await page.getByText(/erase your own personal data under the GDPR/).waitFor();
  assert.equal(await page.getByText(/^Under penalty of perjury/).count(), 0);
  assert.equal(await page.getByLabel('Link to your original work (optional)').count(), 0);
  assert.equal(
    await goodFaith().getAttribute('aria-checked'),
    'false',
    'A changed statement must be affirmed again',
  );
  assert.equal(await accurate().getAttribute('aria-checked'), 'false');
  await page.getByRole('radio', { name: /^Copyright/ }).click();

  // ── Fill in a complete copyright claim ──
  await field('Links to the content').fill(
    'https://cloud.oxy.so/assets/abc\nhttps://mercaria.co/products/42',
  );
  await field('What is it, and why should it be removed?').fill(
    'This is my photograph, copied from my portfolio without permission.',
  );
  await field('Link to your original work (optional)').fill('https://example.com/portfolio/42');
  await field('Full name').fill('Ada Lovelace');
  await field('Email').fill('ada@example.com');
  await page.getByRole('radio', { name: 'I own the rights' }).click();
  await goodFaith().click();
  await accurate().click();
  await field('Electronic signature').fill('Ada Lovelace');

  const assertStillFilled = async () => {
    assert.equal(await field('Full name').inputValue(), 'Ada Lovelace');
    assert.equal(await field('Electronic signature').inputValue(), 'Ada Lovelace');
    assert.equal(await goodFaith().getAttribute('aria-checked'), 'true');
  };

  // ── 5xx: generic error, form kept, retry offered ──
  mode = 'failed';
  await submit();
  await alert().getByText('We could not submit your report').waitFor();
  await alert().getByRole('button', { name: 'Try again' }).waitFor();
  await assertStillFilled();

  // ── 429: rate limited with a time to come back ──
  mode = 'rate_limited';
  await alert().getByRole('button', { name: 'Try again' }).click();
  await alert().getByText('Too many reports in a short time').waitFor();
  await alert()
    .getByText(/^You can submit again after /)
    .waitFor();
  await assertStillFilled();

  // ── 400: the server's field error lands on the field ──
  mode = 'invalid';
  await submit();
  await alert().getByRole('link', { name: 'This address cannot receive mail' }).waitFor();
  assert.equal(
    await page.locator('[id$="-email-error"]').textContent(),
    'This address cannot receive mail',
    'The server field error is shown under the email field',
  );
  await assertStillFilled();

  // ── 201: the reference, and the exact contract body ──
  mode = 'created';
  await submit();
  const received = page.getByRole('heading', { name: 'Report received' });
  await received.waitFor();
  assert.ok(
    await received.evaluate((el) => el === document.activeElement),
    'Focus moves to the confirmation',
  );
  const box = await received.boundingBox();
  assert.ok(box && box.y >= 0 && box.y < 1000, 'The confirmation is on screen');
  await page.getByText('Your reference is OXY-CC-7Q2K.').waitFor();
  await page.getByText('We sent a confirmation to ada@example.com.').waitFor();
  const last = claims.at(-1);
  assert.ok(last, 'The claim reached the API');
  assert.equal(last.method(), 'POST');
  assert.equal(last.headers()['content-type'], 'application/json');
  assert.equal(last.headers().authorization, undefined, 'A signed-out visitor sends no bearer');
  assert.deepEqual(last.postDataJSON(), {
    kind: 'copyright',
    contentUrls: ['https://cloud.oxy.so/assets/abc', 'https://mercaria.co/products/42'],
    description: 'This is my photograph, copied from my portfolio without permission.',
    originalWorkUrl: 'https://example.com/portfolio/42',
    claimant: { name: 'Ada Lovelace', email: 'ada@example.com', relationship: 'rights_holder' },
    statements: { goodFaith: true, accurate: true },
    signature: 'Ada Lovelace',
  });
  assert.equal(claims.length, 4, 'One request per submission, none retried behind the visitor');
  await page.screenshot({ path: '/tmp/content-claims-success.png' });
  console.log('PASS report content: validation, statements per kind, payload, 201/400/429/5xx');

  // ── Mobile and dark ──
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.goto(`${origin}${PATH}`);
  await page.getByRole('heading', { level: 1, name: 'Report content', exact: true }).waitFor();
  await page.getByRole('radio', { name: /^Copyright/ }).click();
  await submit();
  await alert().getByText('Check these fields before you submit').waitFor();
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Mobile overflow on the report form',
  );
  await page.screenshot({ path: '/tmp/content-claims-mobile-dark.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => localStorage.setItem('theme', 'light'));
  await page.reload();
  await page.getByRole('radio', { name: /^Copyright/ }).click();
  await page.screenshot({ path: '/tmp/content-claims-desktop.png', fullPage: true });
  console.log('PASS report content: mobile without overflow, dark mode');

  // ── Linked from the legal collection ──
  await page.goto(`${origin}/transparency/legal/`);
  await page.locator(`#documents a[href="${PATH}"]`).click();
  await page.getByRole('heading', { level: 1, name: 'Report content', exact: true }).waitFor();
  console.log('PASS report content: linked from the legal collection');

  assert.deepEqual(errors, [], 'Unexpected browser errors');
} finally {
  await browser.close();
  preview?.kill();
  if (preview) await preview.exited;
}
