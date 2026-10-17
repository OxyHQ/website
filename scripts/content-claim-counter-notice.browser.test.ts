/**
 * The owner's counter-notice form against the built site, with the Oxy API
 * mocked at the network boundary.
 *
 * Signed out: the reference from the email link is filled in, the form
 * validates and the summary takes focus, and nothing is sent without a session.
 * Signed in (a session restored the way the SDK restores one: the origin's
 * persisted warm token, the application lookup and `GET /users/me`): the exact
 * request body with the account's bearer, and the 400 / ambiguous / 404 / 409 /
 * 429 / 5xx / 201 states, each failure with the form still filled in. Then a
 * non-English locale, which shows the binding English wording under each
 * statement, mobile and dark.
 *
 * Runs in `postbuild`, like the other browser checks.
 */
import { chromium, type BrowserContext, type Request } from 'playwright';
import { strict as assert } from 'node:assert';
import { COUNTER_NOTICE_STATEMENTS } from '@oxy.so/contracts';

const OXY_API = (process.env.VITE_OXY_API || 'https://api.oxy.so').replace(/\/+$/, '');
const PATH = '/transparency/legal/counter-notice/';

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

type Mode =
  | 'created'
  | 'invalid'
  | 'ambiguous'
  | 'not_found'
  | 'exists'
  | 'rate_limited'
  | 'failed';
let mode: Mode = 'failed';
const notices: Request[] = [];

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
const ACCESS_TOKEN = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
  sub: 'user_ada',
  userId: 'user_ada',
  sessionId: 'session_ada',
  exp: Math.floor(Date.now() / 1000) + 3600,
})}.test`;

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
});
const errors: string[] = [];

/** The Oxy API, as far as this page and the SDK's session restore need it. */
async function routeApi(context: BrowserContext) {
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin) {
      return url.pathname.startsWith('/api/')
        ? route.fulfill({ status: 503, json: { error: 'Test: API unavailable' } })
        : route.continue();
    }
    if (url.origin !== new URL(OXY_API).origin) return route.abort();

    const cors = {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET, POST',
      'access-control-allow-headers': '*',
      'access-control-expose-headers': '*',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const path = url.pathname.replace(/^\/api(?=\/)/, '');

    if (path.startsWith('/auth/oauth/client/')) {
      return route.fulfill({
        status: 200,
        headers: cors,
        json: {
          application: {
            id: 'oxy_website',
            name: 'Oxy',
            type: 'first_party',
            isOfficial: true,
            isInternal: false,
            scopes: [],
          },
        },
      });
    }
    if (path === '/users/me') {
      return route.fulfill({
        status: 200,
        headers: cors,
        json: {
          id: 'user_ada',
          _id: 'user_ada',
          username: 'ada',
          email: 'ada@example.com',
          name: { first: 'Ada', last: 'Lovelace', displayName: 'Ada Lovelace' },
        },
      });
    }
    if (path === '/content-claims/counter-notices' && request.method() === 'POST') {
      notices.push(request);
      switch (mode) {
        case 'created':
          return route.fulfill({
            status: 201,
            headers: cors,
            json: {
              id: 'cn_1',
              reference: 'OXY-7K3M-9Q2D',
              state: 'counter_noticed',
              fileIds: ['file_a', 'file_b'],
            },
          });
        case 'invalid':
          return route.fulfill({
            status: 400,
            headers: cors,
            json: {
              error: 'Some details of your counter-notice need attention.',
              code: 'CONTENT_CLAIM_COUNTER_NOTICE_INVALID',
              fields: { 'subscriber.phone': 'This number cannot be reached' },
            },
          });
        case 'ambiguous':
          return route.fulfill({
            status: 400,
            headers: cors,
            json: { error: 'Name the claim', code: 'CONTENT_CLAIM_COUNTER_NOTICE_AMBIGUOUS' },
          });
        case 'not_found':
          return route.fulfill({ status: 404, headers: cors, json: { error: 'No such claim' } });
        case 'exists':
          return route.fulfill({
            status: 409,
            headers: cors,
            json: { error: 'Already sent', code: 'CONTENT_CLAIM_COUNTER_NOTICE_EXISTS' },
          });
        case 'rate_limited':
          return route.fulfill({
            status: 429,
            headers: { ...cors, 'retry-after': '120' },
            json: { error: 'Too many counter-notices in a short time. Try again later.' },
          });
        default:
          return route.fulfill({ status: 503, headers: cors, json: { error: 'Unavailable' } });
      }
    }
    // Everything else the session touches (the account directory, device
    // registration) is best-effort in the SDK; a 404 exercises that.
    return route.fulfill({ status: 404, headers: cors, json: { error: 'Not mocked' } });
  });
}

/** Restore a session the way a returning visitor's browser holds one. */
async function signedIn(context: BrowserContext) {
  await context.addInitScript((token) => {
    localStorage.setItem(
      'oxy.auth.v1',
      JSON.stringify({ sessionId: 'session_ada', userId: 'user_ada' }),
    );
    localStorage.setItem(
      'oxy.auth.token.v1',
      JSON.stringify({
        accessToken: token,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      }),
    );
  }, ACCESS_TOKEN);
}

try {
  // ── Signed out ──
  const outContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await routeApi(outContext);
  let page = await outContext.newPage();
  page.on('pageerror', (error) => errors.push(error.message));

  const alert = () => page.locator('[data-claim-summary]');
  const field = (label: string) => page.getByLabel(label, { exact: true }).first();
  const statement = (pattern: RegExp) => page.getByRole('checkbox', { name: pattern });
  const heading = () =>
    page.getByRole('heading', { level: 1, name: 'Send a counter-notice', exact: true });

  await page.goto(`${origin}${PATH}?reference=oxy-7k3m-9q2d`);
  await heading().waitFor();
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(
    await field('Claim reference').inputValue(),
    'OXY-7K3M-9Q2D',
    'The reference from the email link is filled in',
  );
  await page
    .locator('[data-account-panel]')
    .getByText(/^Sign in with the Oxy account that posted the content/)
    .waitFor();
  for (const text of Object.values(COUNTER_NOTICE_STATEMENTS)) {
    await page.getByRole('checkbox', { name: text, exact: true }).waitFor();
  }
  await page.getByRole('button', { name: 'Sign in to send', exact: true }).click();
  await alert().getByText('Check these fields before you submit').waitFor();
  assert.equal(await alert().locator('li').count(), 12, 'Every missing field is listed');
  assert.ok(
    await page.evaluate(() => document.activeElement?.hasAttribute('data-claim-summary')),
    'Focus moves to the error summary',
  );
  // The summary links each problem to its field.
  await alert().getByRole('link', { name: 'Enter your postal address' }).click();
  assert.ok(
    await page.evaluate(() => document.activeElement?.tagName === 'TEXTAREA'),
    'An error link focuses its field',
  );
  assert.equal(notices.length, 0, 'Nothing is sent without a session');
  console.log('PASS counter-notice (signed out): prefilled reference, validation, focus, gate');

  // ── Linked from the report form and the legal collection ──
  await page.goto(`${origin}/transparency/legal/report-content/`);
  await page.getByRole('link', { name: 'Send a counter-notice', exact: true }).click();
  await heading().waitFor();
  await page.goto(`${origin}/transparency/legal/`);
  await page.locator(`#documents a[href="${PATH}"]`).click();
  await heading().waitFor();
  console.log('PASS counter-notice: linked from the report form and the legal collection');
  await outContext.close();

  // ── Signed in ──
  const inContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await routeApi(inContext);
  await signedIn(inContext);
  page = await inContext.newPage();
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${origin}${PATH}?reference=OXY-7K3M-9Q2D`);
  await heading().waitFor();
  await page.getByText('Signed in as @ada.', { exact: false }).waitFor({ timeout: 20_000 });
  assert.equal(await field('Full legal name').inputValue(), 'Ada Lovelace', 'Name from session');
  assert.equal(await field('Email').inputValue(), 'ada@example.com', 'Email from session');

  await field('What was removed?').fill('A photograph of my own garden.');
  await field('Where did it appear before it was removed?').fill('A post on my Mention profile');
  await field('Why was the removal a mistake?').fill(
    'I took this photograph myself and never licensed it to anyone.',
  );
  await field('Telephone').fill('+44 20 7946 0000');
  await field('Postal address').fill('12 St James’s Square, London SW1Y 4JH');
  await statement(/^I swear, under penalty of perjury/).click();
  await statement(/^I consent to the jurisdiction/).click();
  await statement(/^I will accept service of process/).click();
  await statement(/^I understand that Oxy sends a copy/).click();
  await field('Electronic signature').fill('Ada Lovelace');

  const submit = () =>
    page.getByRole('button', { name: 'Send counter-notice', exact: true }).click();
  const assertStillFilled = async () => {
    assert.equal(await field('Electronic signature').inputValue(), 'Ada Lovelace');
    assert.equal(await field('Telephone').inputValue(), '+44 20 7946 0000');
    assert.equal(
      await statement(/^I swear, under penalty of perjury/).getAttribute('aria-checked'),
      'true',
    );
  };

  // 5xx: generic error, form kept, retry offered.
  mode = 'failed';
  await submit();
  await alert().getByText('We could not send your counter-notice').waitFor();
  await alert().getByRole('button', { name: 'Try again' }).waitFor();
  await assertStillFilled();

  // 429 with a time to come back.
  mode = 'rate_limited';
  await alert().getByRole('button', { name: 'Try again' }).click();
  await alert().getByText('Too many counter-notices in a short time').waitFor();
  await alert()
    .getByText(/^You can send again after /)
    .waitFor();
  await assertStillFilled();

  // 404: no removal of this account's content.
  mode = 'not_found';
  await submit();
  await alert().getByText('We found no removal to dispute').waitFor();
  await assertStillFilled();

  // 409: already sent.
  mode = 'exists';
  await submit();
  await alert().getByText('You already sent a counter-notice').waitFor();

  // 400 ambiguous: the reference field is where the answer goes.
  mode = 'ambiguous';
  await submit();
  await alert()
    .getByRole('link', { name: /removed after more than one claim/ })
    .waitFor();

  // 400 with fields: the server's error lands on the field.
  mode = 'invalid';
  await submit();
  await alert().getByRole('link', { name: 'This number cannot be reached' }).waitFor();
  assert.equal(
    await page.locator('[id$="-phone-error"]').textContent(),
    'This number cannot be reached',
    'The server field error is shown under the telephone field',
  );
  await assertStillFilled();

  // 201: the claim, the files and the exact contract body, with the bearer.
  mode = 'created';
  await submit();
  const received = page.getByRole('heading', { name: 'Counter-notice received' });
  await received.waitFor();
  assert.ok(
    await received.evaluate((el) => el === document.activeElement),
    'Focus moves to the confirmation',
  );
  await page.getByText('It answers the claim OXY-7K3M-9Q2D.').waitFor();
  await page.getByText('It covers 2 removed files.').waitFor();
  await page.getByText('We sent a confirmation to ada@example.com.').waitFor();
  const last = notices.at(-1);
  assert.ok(last, 'The counter-notice reached the API');
  assert.equal(last.method(), 'POST');
  assert.equal(last.headers().authorization, `Bearer ${ACCESS_TOKEN}`, 'Sent as the account');
  assert.equal(last.headers()['content-type'], 'application/json');
  assert.deepEqual(last.postDataJSON(), {
    reference: 'OXY-7K3M-9Q2D',
    subscriber: {
      name: 'Ada Lovelace',
      address: '12 St James’s Square, London SW1Y 4JH',
      phone: '+44 20 7946 0000',
      email: 'ada@example.com',
    },
    material: {
      description: 'A photograph of my own garden.',
      location: 'A post on my Mention profile',
    },
    explanation: 'I took this photograph myself and never licensed it to anyone.',
    statements: { perjury: true, jurisdiction: true, serviceOfProcess: true, disclosure: true },
    signature: 'Ada Lovelace',
  });
  assert.equal(notices.length, 7, 'One request per submission, none retried behind the owner');
  await page.screenshot({ path: '/tmp/counter-notice-success.png' });
  console.log(
    'PASS counter-notice (signed in): bearer, payload, 201/400/ambiguous/404/409/429/5xx',
  );

  // ── Another locale: translated, with the binding English beneath ──
  const esContext = await browser.newContext({ locale: 'es-ES' });
  await routeApi(esContext);
  await esContext.addInitScript(() => localStorage.setItem('oxy:locale', 'es'));
  const esPage = await esContext.newPage();
  esPage.on('pageerror', (error) => errors.push(error.message));
  await esPage.goto(`${origin}${PATH}`);
  await esPage
    .getByRole('heading', { level: 1, name: 'Enviar una contranotificación', exact: true })
    .waitFor();
  const english = esPage.locator('p[lang="en"]');
  assert.equal(await english.count(), 4, 'Each statement shows its English wording');
  assert.equal(await english.first().textContent(), COUNTER_NOTICE_STATEMENTS.perjury);
  await esContext.close();
  console.log('PASS counter-notice: Spanish, with the English statements it records');

  // ── Mobile and dark ──
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.goto(`${origin}${PATH}`);
  await heading().waitFor();
  await page.getByRole('button', { name: 'Send counter-notice', exact: true }).click();
  await alert().getByText('Check these fields before you submit').waitFor();
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'Mobile overflow on the counter-notice form',
  );
  await page.screenshot({ path: '/tmp/counter-notice-mobile-dark.png', fullPage: true });
  console.log('PASS counter-notice: mobile without overflow, dark mode');

  assert.deepEqual(errors, [], 'Unexpected browser errors');
} finally {
  await browser.close();
  preview?.kill();
  if (preview) await preview.exited;
}
