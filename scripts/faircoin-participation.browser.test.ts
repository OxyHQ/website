/** Private intake against the real UI, with the API replaced at its network boundary. */
import { strict as assert } from 'node:assert';
import { chromium, type Request } from 'playwright';

const externalOrigin = process.env.FAIRCOIN_TEST_ORIGIN || process.env.TEST_ORIGIN;
const reserved = Bun.serve({ port: 0, fetch: () => new Response('reserved') });
const port = reserved.port;
reserved.stop(true);
const preview = externalOrigin
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
const origin = externalOrigin || `http://127.0.0.1:${port}`;
if (preview) {
  let ready = false;
  for (let attempt = 0; attempt < 50 && !ready; attempt++) {
    try {
      ready = (await fetch(origin)).ok;
    } catch {
      // Preview is starting.
    }
    if (!ready) await Bun.sleep(100);
  }
  if (!ready) {
    preview.kill();
    throw new Error('Vite preview did not start');
  }
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
let intake: 'closed' | 'open' | 'failed' | 'invalid' = 'closed';
let responseStatus = 503;
let responseCode = 'APPLICATIONS_CLOSED';
const applications: Request[] = [];

await context.route('**/*', async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  const cors = {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type, idempotency-key',
  };
  if (url.pathname === '/api/faircoin/applications/status') {
    if (intake === 'failed') return route.fulfill({ status: 503, headers: cors, json: {} });
    if (intake === 'invalid') return route.fulfill({ status: 200, headers: cors, json: {} });
    return route.fulfill({
      status: 200,
      headers: cors,
      json: {
        state: 'preparation',
        acceptingApplications: intake === 'open',
        retentionDays: intake === 'open' ? 30 : null,
        privacyContact: intake === 'open' ? 'review@example.com' : null,
      },
    });
  }
  if (url.pathname === '/api/faircoin/applications') {
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    applications.push(request);
    return route.fulfill({
      status: responseStatus,
      headers: cors,
      json:
        responseStatus === 201
          ? {
              id: 'abcdefabcdefabcdefabcdef',
              status: 'received',
              submittedAt: '2026-11-14T12:00:00.000Z',
              deleteAfter: '2026-12-14T12:00:00.000Z',
            }
          : { code: responseCode, error: '<script>private-server-detail</script>' },
    });
  }
  if (url.pathname.startsWith('/api/'))
    return route.fulfill({ status: 503, headers: cors, json: { error: 'Test: API unavailable' } });
  if (url.origin !== origin) return route.abort();
  return route.continue();
});

const path = `${origin}/faircoin/participate/`;
const field = (label: string) => page.getByLabel(label, { exact: true }).first();
const summary = () => page.locator('[data-application-summary]');
const submit = async () => {
  await page.getByRole('button', { name: 'Send private application', exact: true }).focus();
  await page.keyboard.press('Enter');
};

try {
  await page.goto(path);
  await page.getByText('Applications are not open yet.', { exact: false }).waitFor();
  assert.equal(await page.locator('form').count(), 0, 'Closed intake collects no data');
  assert.equal(applications.length, 0);
  assert.equal(await page.locator('h1').count(), 1);

  for (const state of ['failed', 'invalid'] as const) {
    intake = state;
    await page.reload();
    await page
      .getByText('We could not check whether applications are open.', { exact: false })
      .waitFor();
    assert.equal(await page.locator('form').count(), 0, 'A status failure cannot open intake');
  }
  intake = 'open';
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await field('Project name').waitFor();
  await page.getByText('Applications are deleted after 30 days.', { exact: false }).waitFor();
  await page.getByText('To request deletion, contact review@example.com.').waitFor();

  await submit();
  await summary().getByText('Check the highlighted fields and try again.').waitFor();
  assert.equal(await summary().locator('li').count(), 9);
  assert.equal(applications.length, 0, 'Shared validation prevents invalid API calls');
  assert(await summary().evaluate((element) => element === document.activeElement));
  assert(
    await summary().evaluate(
      (element) =>
        element.getBoundingClientRect().top >=
        (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0),
    ),
    'The focused error summary must be visible below the fixed header',
  );
  await summary().getByRole('link', { name: 'Project name', exact: true }).click();
  assert(await field('Project name').evaluate((element) => element === document.activeElement));
  await page.keyboard.type('Independent Workshop');
  assert(
    await field('Project name').evaluate((element) => element === document.activeElement),
    'Correcting an error must not steal focus',
  );
  await page.keyboard.press('Tab');
  assert(
    await field('Public website (Optional)').evaluate(
      (element) => element === document.activeElement,
    ),
  );

  const values = {
    'Public website (Optional)': 'https://example.com/workshop',
    'Contact name': 'Private Example',
    'Private contact email': 'private-example@example.com',
    'What can you offer?': 'A small repair workshop. <img src=x onerror="window.bad=true">',
    'What do you need in return?': 'Help translating a guide.',
    Capacity: 'One workshop each month.',
    Availability: 'Weekends next month.',
    'Proposed conditions': 'Agree the scope before a trial; either party may decline.',
  };
  for (const [label, value] of Object.entries(values)) await field(label).fill(value);
  const consent = page.getByRole('checkbox', {
    name: 'I agree to be contacted privately about this application.',
  });
  await consent.focus();
  await page.keyboard.press('Space');
  assert.equal(await consent.getAttribute('aria-checked'), 'true');
  assert.equal(
    await page.getByRole('checkbox', { name: /future updates/ }).getAttribute('aria-checked'),
    'false',
  );

  const assertPreserved = async () => {
    assert.equal(await field('Project name').inputValue(), 'Independent Workshop');
    for (const [label, value] of Object.entries(values))
      assert.equal(await field(label).inputValue(), value);
    assert.equal(await consent.getAttribute('aria-checked'), 'true');
    assert.equal(await page.getByText('private-server-detail', { exact: false }).count(), 0);
    assert.equal(
      await page.evaluate(() => 'bad' in window),
      false,
      'Text is never interpreted as HTML',
    );
  };

  for (const [status, code, text] of [
    [503, 'APPLICATIONS_CLOSED', 'Applications are not open yet.'],
    [503, 'TEMPORARILY_UNAVAILABLE', 'We could not confirm receipt.'],
    [429, 'RATE_LIMITED', 'Too many attempts.'],
    [500, 'TEST_FAILURE', 'We could not confirm receipt.'],
    [400, 'VALIDATION_ERROR', 'Check the highlighted fields and try again.'],
  ] as const) {
    responseStatus = status;
    responseCode = code;
    await submit();
    await summary().getByText(text, { exact: false }).waitFor();
    await assertPreserved();
  }
  const keys = applications.map((request) => request.headers()['idempotency-key']);
  assert(keys[0] && new Set(keys).size === 1, 'Ambiguous failures reuse the same key');
  assert(
    applications.every((request) => !request.headers().authorization && !request.headers().cookie),
  );
  assert(applications.every((request) => request.postDataJSON().updatesConsent === false));

  responseStatus = 409;
  await submit();
  await summary()
    .getByText('This submission reference was already used', { exact: false })
    .waitFor();
  await assertPreserved();
  responseStatus = 201;
  await submit();
  await page.getByRole('heading', { name: 'Application received', exact: true }).waitFor();
  await page.getByText('Reference: abcdefabcdefabcdefabcdef').waitFor();
  await page.waitForFunction(() => {
    const receipt = document.querySelector('main [role="status"][tabindex="-1"]');
    const bounds = receipt?.getBoundingClientRect();
    return (
      receipt === document.activeElement &&
      bounds &&
      bounds.top >= (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0) &&
      bounds.bottom <= innerHeight
    );
  });
  assert.notEqual(
    applications.at(-1)?.headers()['idempotency-key'],
    keys[0],
    'Confirmed conflicts allow a fresh key on explicit retry',
  );
  assert.equal(await page.locator('form').count(), 0);
  const visible = await page.locator('main').innerText();
  assert(!visible.includes('Private Example') && !visible.includes('private-example@example.com'));
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  assert(!stored.includes('Private Example') && !stored.includes('private-example@example.com'));
  intake = 'open';
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 1024 ? 844 : 1000 });
    for (const route of ['participate', 'pilot']) {
      await page.goto(`${origin}/faircoin/${route}/`);
      await page.locator('main h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const bounds = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        title: document.querySelector('main h1')?.getBoundingClientRect().top ?? 0,
        header: document.querySelector('header')?.getBoundingClientRect().bottom ?? 0,
      }));
      assert(!bounds.overflow, `${route} must fit ${width}px`);
      assert(bounds.title >= bounds.header + 24, `${route} clears header at ${width}px`);
    }
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto(`${origin}/faircoin/#participation`);
    await page.locator('#participation').waitFor();
    await page.locator('#participation').evaluate((element) =>
      window.scrollTo({
        top: element.getBoundingClientRect().top + scrollY,
        behavior: 'instant',
      }),
    );
    await page.waitForFunction(() => !!document.querySelector('header .force-dark'));
  }
  // The editorial stages must remain readable and navigable in both motion modes.
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    await page.emulateMedia({ reducedMotion });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(`${origin}/faircoin/pilot/`);
      await page.locator('.pilot-story h1').waitFor();
      await page.locator('.pilot-method-link').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => location.hash === '#pilot-match');
      for (const id of [
        'pilot-match',
        'pilot-agree',
        'pilot-review-title',
        'pilot-agree',
        'pilot-match',
      ]) {
        const section = page.locator(`#${id}`);
        await section.evaluate((element) =>
          window.scrollTo({
            top: element.getBoundingClientRect().top + scrollY,
            behavior: 'instant',
          }),
        );
        await page.waitForFunction(
          (dark) => !!document.querySelector('header .force-dark') === dark,
          id === 'pilot-agree',
        );
      }
      await page.locator('#pilot-agree').scrollIntoViewIfNeeded();
      await page.waitForFunction(() =>
        [...document.querySelectorAll<HTMLImageElement>('.pilot-story img')].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      );
      if (reducedMotion === 'no-preference') {
        const photo = page.locator('#pilot-agree .pilot-photograph');
        await photo.evaluate((element) =>
          window.scrollTo({
            top: element.getBoundingClientRect().top + scrollY - innerHeight * 0.85,
            behavior: 'instant',
          }),
        );
        await page.waitForFunction(
          () =>
            getComputedStyle(
              document.querySelector('#pilot-agree .pilot-photo-crop') as HTMLElement,
            ).clipPath !== 'none',
        );
        const before = await photo
          .locator('.pilot-photo-crop')
          .evaluate((element) => getComputedStyle(element).clipPath);
        await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'instant' }));
        await page.waitForFunction(
          (previous) =>
            getComputedStyle(
              document.querySelector('#pilot-agree .pilot-photo-crop') as HTMLElement,
            ).clipPath !== previous,
          before,
        );
      }
      if (reducedMotion === 'reduce') {
        assert(
          await page
            .locator('.pilot-story img')
            .evaluateAll((images) =>
              images.every((image) => getComputedStyle(image).transform === 'none'),
            ),
          'Reduced motion keeps editorial photos still',
        );
      }
      await page.locator('footer').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => !document.querySelector('header .force-dark'));
      assert.equal(await page.locator('main a[href="mailto:oxy@oxy.so"]').count(), 1);
    }
  }
  await page.goto(`${origin}/es/faircoin/pilot/`);
  await page
    .getByRole('heading', { name: 'Cómo funciona el piloto de FairCoin', exact: true })
    .waitFor();
  await page.locator('main a[href="/es/faircoin/participate/"]').first().click();
  await page.locator('main h1').waitFor();
  await page.goBack();
  await page
    .getByRole('heading', { name: 'Cómo funciona el piloto de FairCoin', exact: true })
    .waitFor();
  await page.goForward();
  await page.reload();
  assert(new URL(page.url()).pathname === '/es/faircoin/participate/');

  await context.route('https://fairco.in/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/api/')) return route.fallback();
    const response = await route.fetch({ url: `${origin}${url.pathname}${url.search}` });
    return route.fulfill({ response });
  });
  await page.goto('https://fairco.in/es/pilot/');
  await page
    .getByRole('heading', { name: 'Cómo funciona el piloto de FairCoin', exact: true })
    .waitFor();
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    'https://fairco.in/es/pilot/',
  );
  await page.locator('main a[href="/es/participate/"]').first().click();
  await page.reload();
  await page.locator('main h1').waitFor();
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute('href'),
    'https://fairco.in/es/participate/',
  );
  assert.equal(await page.locator('main a[href*="/faircoin/"]').count(), 0);

  // The production documents must explain preparation without any app scripts.
  if (preview) {
    const staticPage = await context.newPage();
    await staticPage.route('**/*.js', (route) => route.abort());
    for (const route of ['participate', 'pilot']) {
      await staticPage.goto(`${origin}/faircoin/${route}/`);
      await staticPage.locator('main h1').waitFor();
      assert(
        (await staticPage.locator('main').innerText()).includes(
          'In preparation. No public offers are available yet.',
        ),
      );
      assert.equal(await staticPage.locator('form').count(), 0);
    }
    await staticPage.goto(`${origin}/faircoin/`);
    await staticPage.locator('#participation').waitFor();
    assert.equal(
      await staticPage.locator('#participation a[href="/faircoin/participate/"]').count(),
      1,
    );
    await staticPage.close();
  }
  assert.deepEqual(errors, [], 'Unexpected browser errors');
  console.log(
    'PASS FairCoin participation: private intake and retries, keyboard, six widths, both hosts, locale history, header contrast and static prose',
  );
} finally {
  await browser.close();
  preview?.kill();
  if (preview) await preview.exited;
}
