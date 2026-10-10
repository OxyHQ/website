import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { chromium, type Page } from 'playwright';
import { BLOOM_CHARACTER_BASE } from '../src/lib/bloomCharacterRuntime';

const ROOT = join(import.meta.dir, '..');
const reservation = Bun.serve({
  port: 0,
  fetch: () => new Response('reserved'),
});
const port = reservation.port;
reservation.stop(true);
const preview = Bun.spawn(
  ['bunx', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { cwd: ROOT, stdout: 'ignore', stderr: 'ignore' },
);
const origin = process.env.BLOOM_TEST_ORIGIN || `http://127.0.0.1:${port}`;
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
});
function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

async function assertNoOverflow(page: Page) {
  invariant(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    'landing causes horizontal page scrolling',
  );
}

try {
  if (!process.env.BLOOM_TEST_ORIGIN) {
    const require = createRequire(import.meta.url);
    const source = join(
      dirname(require.resolve('@oxy.so/bloom/package.json')),
      'assets/character-runtime',
    );
    for (const file of readdirSync(source, { recursive: true, withFileTypes: true })) {
      if (!file.isFile()) continue;
      const name = relative(source, join(file.parentPath, file.name));
      invariant(
        readFileSync(join(file.parentPath, file.name)).equals(
          readFileSync(join(ROOT, 'dist', BLOOM_CHARACTER_BASE, name)),
        ),
        `published Bloom runtime asset was modified: ${name}`,
      );
    }
  }
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {
      /* preview starting */
    }
    await Bun.sleep(100);
  }
  for (const [file, mime] of [
    ['runtime.mjs', 'text/javascript'],
    ['orbit-characters.wasm', 'application/wasm'],
  ] as const) {
    const response = await fetch(`${origin}${BLOOM_CHARACTER_BASE}${file}`, { method: 'HEAD' });
    invariant(
      response.ok && response.headers.get('content-type')?.includes(mime),
      `Bloom runtime asset is missing or served with the wrong MIME type: ${file}`,
    );
  }
  for (const mode of ['light', 'dark'] as const) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      reducedMotion: 'reduce',
    });
    await context.addInitScript((mode) => localStorage.setItem('theme', mode), mode);
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // A generated brand palette must match before and after React starts.
    await page.route('**/*.js', (route) => route.abort());
    await page.goto(`${origin}/bloom/`);
    // Marketing routes prerender their head. Probe the generated scoped
    // palette with scripts blocked before comparing the actual React shell.
    await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.className = 'bg-background';
      probe.id = 'bloom-prepaint-probe';
      document.querySelector('body')!.appendChild(probe);
    });
    const prepaint = await page
      .locator('#bloom-prepaint-probe')
      .evaluate((node) => getComputedStyle(node).backgroundColor);
    await page.unroute('**/*.js');
    await page.reload();
    await page.locator('main h1').waitFor();
    invariant(
      (await page
        .locator('.bloom-landing')
        .evaluate((node) => getComputedStyle(node).backgroundColor)) === prepaint,
      `${mode} brand palette changes when React mounts`,
    );
    invariant(
      (await page.locator('link[rel="canonical"]').getAttribute('href')) ===
        'https://oxy.so/bloom/',
      'wrong canonical',
    );
    await assertNoOverflow(page);
    const gallery = page.locator('#bloom-components').locator('xpath=ancestor::section');
    const cards = gallery.locator('article');
    invariant((await cards.count()) === 16, 'component gallery is incomplete');
    const first = await cards.first().boundingBox();
    const fourth = await cards.nth(3).boundingBox();
    invariant(
      first && fourth && first.width === 304 && first.y === fourth.y,
      'desktop gallery no longer matches the four-column reference',
    );
    // Scroll every visible gallery row and section so lazy preview failures
    // cannot be hidden by an error boundary or an unmounted placeholder.
    for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += 650) {
      await page.evaluate((y) => scrollTo(0, y), y);
      await page.waitForTimeout(100);
    }
    invariant(
      (await page.locator('.bloom-preview-fallback').count()) === 0,
      'a Bloom component failed to render',
    );
    invariant(errors.length === 0, `browser errors: ${errors.join('; ')}`);
    // Explicitly enter these lazy previews: a fast sweep can pass the row
    // while another composition is still changing the document's height.
    await cards.nth(11).scrollIntoViewIfNeeded();
    await cards.nth(11).getByRole('button', { name: 'Inbox', exact: true }).waitFor();
    invariant(
      (await cards.nth(11).getByRole('button', { name: 'Inbox', exact: true }).count()) === 1,
      'calendar thumbnail is a date picker instead of the monthly event calendar',
    );
    await cards.nth(12).scrollIntoViewIfNeeded();
    await cards.nth(12).getByLabel('Full name', { exact: true }).waitFor();
    invariant(
      (await cards.nth(12).getByRole('textbox').count()) === 3,
      'auth thumbnail is missing the registration fields',
    );
    const loader = page.locator('#bloom-loader').locator('xpath=ancestor::section');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await loader.scrollIntoViewIfNeeded();
    const composer = loader.locator('[data-bloom-composer-pill]');
    await composer.waitFor();
    const orbit = loader.locator('.bloom-composer-loader-rect').last();
    await orbit.waitFor({ state: 'attached' });
    invariant(
      await orbit.evaluate((node) => {
        const rect = node as SVGRectElement;
        // A CSS pill radius (999) becomes an ellipse in SVG: rx is clamped
        // to half the WIDTH while ry is clamped to half the HEIGHT.
        return rect.rx.baseVal.value === rect.height.baseVal.value / 2;
      }),
      'loader light follows an ellipse instead of the composer rim',
    );
    const phase = await orbit.evaluate((node) => getComputedStyle(node).strokeDashoffset);
    await page.waitForTimeout(180);
    invariant(
      (await orbit.evaluate((node) => getComputedStyle(node).strokeDashoffset)) !== phase,
      'visible composer loader is not animating',
    );
    invariant(
      await composer.evaluate((node) => {
        const root = node as HTMLElement;
        const field = root.querySelector('textarea')!;
        return root.offsetWidth === 560 && root.offsetHeight === 52 && field.clientHeight === 20;
      }),
      'empty composer loses width or wraps its prompt in the scaled preview',
    );
    const lightPalette = loader.getByRole('group', {
      name: 'Composer light colour',
    });
    const gradient = loader.locator('linearGradient stop').first();
    const originalLight = await gradient.getAttribute('stop-color');
    await lightPalette.getByRole('button', { name: 'blue light', exact: true }).click();
    invariant(
      (await gradient.getAttribute('stop-color')) !== originalLight,
      'loader palette does not change its light',
    );
    await lightPalette.getByRole('button', { name: 'iridescent light', exact: true }).click();
    const composerField = composer.getByRole('textbox');
    await composerField.fill('Build with Bloom');
    await composer.getByRole('button', { name: 'Send message', exact: true }).click();
    invariant((await composerField.inputValue()) === '', 'composer does not clear after sending');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const sidebar = page.locator('[data-bloom-preview="sidebar"]').first();
    await sidebar.scrollIntoViewIfNeeded();
    const mosaic = sidebar.locator('xpath=ancestor::section');
    await page.setViewportSize({ width: 2560, height: 1200 });
    await mosaic
      .locator('[data-bloom-preview="accounts"]')
      .getByText('Maya Collins', { exact: true })
      .waitFor();
    await mosaic
      .locator('[data-bloom-preview="auth"]')
      .getByRole('textbox', { name: 'Email', exact: false })
      .waitFor();
    async function assertMosaicFits() {
      const overlaps = await mosaic.locator('[data-bloom-preview]').evaluateAll((nodes) => {
        const boxes = nodes.map((node) => ({
          name: node.getAttribute('data-bloom-preview'),
          rect: node.getBoundingClientRect(),
        }));
        return boxes.flatMap((a, i) =>
          boxes
            .slice(i + 1)
            .filter(
              (b) =>
                Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left) > 1 &&
                Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top) > 1,
            )
            .map((b) => `${a.name}/${b.name}`),
        );
      });
      invariant(overlaps.length === 0, `mosaic cards overlap: ${overlaps.join(', ')}`);
    }
    await assertMosaicFits();
    const accounts = mosaic.locator('[data-bloom-preview="accounts"]');
    const auth = mosaic.locator('[data-bloom-preview="auth"]');
    const accountsBox = await accounts.boundingBox();
    const authBox = await auth.boundingBox();
    invariant(
      accountsBox?.height === 235 &&
        authBox &&
        authBox.y - accountsBox.y - accountsBox.height === 22,
      'access card does not fit the reference row and gap',
    );
    await accounts.getByRole('button', { name: 'Add user', exact: true }).click();
    await assertMosaicFits();
    await page.setViewportSize({ width: 375, height: 900 });
    await assertMosaicFits();
    await page.setViewportSize({ width: 1440, height: 1100 });
    await sidebar.scrollIntoViewIfNeeded();
    const progress = page.locator('[data-bloom-preview="progress"]').first();
    const models = page.locator('[data-bloom-preview="models"]').first();
    const before = [
      await sidebar.boundingBox(),
      await progress.boundingBox(),
      await models.boundingBox(),
    ];
    await sidebar.getByRole('button', { name: 'Collapse sidebar', exact: true }).click();
    await page.waitForTimeout(350);
    const after = [
      await sidebar.boundingBox(),
      await progress.boundingBox(),
      await models.boundingBox(),
    ];
    invariant(before.every(Boolean) && after.every(Boolean), 'mosaic geometry is unavailable');
    invariant(
      after[0]!.width === 60 &&
        after[1]!.x === before[1]!.x - 200 &&
        after[2]!.x === before[2]!.x - 200,
      'sidebar collapse does not move the adjacent cards with the reference layout',
    );
    await sidebar.getByRole('button', { name: 'Expand sidebar', exact: true }).click();
    await page.waitForTimeout(350);
    const search = page
      .locator('[data-bloom-preview="table"]')
      .first()
      .getByRole('textbox')
      .first();
    await search.scrollIntoViewIfNeeded();
    await search.fill('Maya');
    const table = page.locator('[data-bloom-preview="table"]').first();
    invariant(
      (await table.getByText('8 customers', { exact: true }).count()) === 1,
      'table search does not filter rows',
    );
    await search.fill('');
    await page.locator('[data-bloom-preview="multi-agent"]').scrollIntoViewIfNeeded();
    const chat = page.getByTestId('multi-agent-chat');
    await chat.getByRole('textbox', { name: 'Agent name', exact: true }).fill('Launch planner');
    // Filling the name scrolls the editor below its avatar. On a cold/slow
    // renderer the preview has not intersected yet, so capabilities stay
    // pending and Playwright will not scroll a disabled eye button into view.
    // Center the preview in both scroll containers; an edge-visible image can
    // still leave its lazy renderer outside the clipped editor viewport.
    await chat
      .getByRole('img', { name: 'Launch planner, live avatar preview', exact: true })
      .evaluate((node) =>
        node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }),
      );
    await chat.getByRole('button', { name: 'Sparkle capsules', exact: true }).click();
    invariant(
      (await chat
        .getByRole('button', { name: 'Sparkle capsules', exact: true })
        .getAttribute('aria-pressed')) === 'true',
      'agent eye style does not change',
    );
    await chat.getByRole('button', { name: 'Create bot or chat', exact: true }).click();
    await page.getByRole('menuitem', { name: /Chat with your agents/ }).click();
    await page.getByRole('button', { name: 'Launch planner', exact: true }).last().click();
    await page.getByRole('button', { name: 'content reviewer', exact: true }).last().click();
    await page.getByRole('button', { name: /Start chat.*2 agents/ }).click();
    // Wait for THIS conversation. The team chat that was active is also an
    // empty group chat with the same headline, and Start chat measures the
    // picker before switching: typing on the generic headline raced into
    // the previous chat's composer and the send never happened.
    await chat.getByText(/^Launch planner, content reviewer are here\./).waitFor();
    await chat
      .getByPlaceholder('Hi, what do you need today?', { exact: true })
      .fill('Help me plan the release');
    await chat.getByRole('button', { name: 'Send message', exact: true }).click();
    await chat.getByRole('button', { name: 'Stop generating', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    invariant(
      (await page.getByRole('dialog').count()) === 0,
      'resizing opens the agent editor over the page',
    );
    await chat
      .getByLabel('Agent conversation', { exact: true })
      .getByText('Help me plan the release', { exact: true })
      .waitFor();
    await page.setViewportSize({ width: 1440, height: 1100 });
    await chat
      .getByLabel('Agent conversation', { exact: true })
      .getByText('Help me plan the release', { exact: true })
      .waitFor();
    const templates = page.locator('section[aria-labelledby="bloom-examples"]');
    await templates.scrollIntoViewIfNeeded();
    const templateChat = templates.locator('[data-bloom-preview="template-chat"]');
    await templateChat.getByRole('textbox').last().fill('Build a release dashboard');
    await templateChat.getByRole('button', { name: 'Send message', exact: true }).click();
    await templateChat.getByText('Build a release dashboard', { exact: true }).waitFor();
    await templateChat.getByRole('button', { name: 'Dashboards', exact: true }).click();
    await templateChat.getByRole('heading', { name: 'Dashboards', exact: true }).waitFor();
    const chartPreviews = page.locator(
      'section[aria-labelledby="bloom-charts"] [data-bloom-preview]',
    );
    for (const chart of await chartPreviews.all()) {
      await chart.scrollIntoViewIfNeeded();
      await chart.locator('> div:not(.bloom-preview-placeholder)').waitFor();
      invariant(
        await chart.evaluate((node) => {
          const card = node.firstElementChild!;
          const reserved = node.parentElement!.parentElement!.parentElement!;
          return card.getBoundingClientRect().bottom <= reserved.getBoundingClientRect().bottom + 1;
        }),
        `chart clips its content: ${await chart.getAttribute('data-bloom-preview')}`,
      );
    }
    const earnings = page.locator(
      'section[aria-labelledby="bloom-charts"] [data-bloom-preview="earnings"]',
    );
    await earnings.scrollIntoViewIfNeeded();
    await earnings.getByRole('radio', { name: 'Month', exact: true }).click();
    await earnings.getByText('$18,240', { exact: true }).waitFor();
    await page
      .locator('section[aria-labelledby="bloom-examples"]')
      .getByRole('tab', { name: 'Project Management', exact: true })
      .click();
    const board = page.getByTestId('project-board');
    await board.getByRole('button', { name: 'New ticket', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Ticket title', exact: true })
      .fill('Ship the Bloom page');
    await page.getByRole('button', { name: 'Create ticket', exact: true }).click();
    await board.getByRole('button', { name: /Open .*Ship the Bloom page/ }).waitFor();
    await board
      .getByRole('button', {
        name: 'Open BL-1: Composer attachments',
        exact: true,
      })
      .click();
    await page.getByRole('button', { name: 'Add to favorites', exact: true }).click();
    await page.getByRole('button', { name: 'Remove from favorites', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Close ticket details', exact: true }).click();
    const faq = page.locator('#bloom-faq').locator('xpath=ancestor::section');
    const question = faq.getByRole('button', {
      name: 'How do I install Bloom?',
    });
    await question.scrollIntoViewIfNeeded();
    const closedRow = await question.locator('..').boundingBox();
    invariant(
      closedRow?.height === 66,
      'closed FAQ row reserves answer padding instead of matching the 66px reference',
    );
    await question.click();
    invariant((await question.getAttribute('aria-expanded')) === 'true', 'FAQ does not expand');
    await page.setViewportSize({ width: 768, height: 1024 });
    await assertNoOverflow(page);
    const firstTablet = await cards.first().boundingBox();
    const secondTablet = await cards.nth(1).boundingBox();
    const thirdTablet = await cards.nth(2).boundingBox();
    invariant(
      firstTablet &&
        secondTablet &&
        thirdTablet &&
        firstTablet.y === secondTablet.y &&
        thirdTablet.y > firstTablet.y,
      'tablet gallery is not two columns',
    );
    await page.setViewportSize({ width: 375, height: 900 });
    await assertNoOverflow(page);
    const firstMobile = await cards.first().boundingBox();
    const secondMobile = await cards.nth(1).boundingBox();
    invariant(
      firstMobile && secondMobile && secondMobile.y > firstMobile.y,
      'mobile gallery is not one column',
    );
    await page.goto(`${origin}/es/bloom/`);
    await page.locator('main h1').waitFor();
    invariant(
      !(await page.locator('main h1').innerText()).includes('React Design System'),
      'Spanish hero is not translated',
    );
    await assertNoOverflow(page);
    invariant(errors.length === 0, `browser errors: ${errors.join('; ')}`);
    await context.close();
  }
  console.log(
    '[bloom-landing] light/dark prepaint, desktop/tablet/mobile layout, previews, table, FAQ and Spanish route passed',
  );
} finally {
  await browser.close();
  preview.kill();
  await preview.exited;
}
