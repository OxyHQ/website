import { join, resolve, extname } from 'node:path'
import { chromium } from 'playwright'

// Exercise the built routes with the response policies used by Cloudflare.
// Unlike vite preview, this serves the dedicated canvas CSP and asset CORS.
const root = resolve(import.meta.dir, '..', 'dist')
const headers = await Bun.file(join(root, '_headers')).text()
const policies = [...headers.matchAll(/^  Content-Security-Policy: (.+)$/gm)].map((m) => m[1])
if (policies.length !== 2 || policies[0].includes("'unsafe-eval'"))
  throw new Error('Unexpected main/canvas CSP policies')
const mime: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
}
const server = Bun.serve({
  port: 0,
  async fetch(request) {
    const path = decodeURIComponent(new URL(request.url).pathname)
    let file = resolve(root, `.${path}`)
    if (!file.startsWith(`${root}/`) && file !== root)
      return new Response('Not found', { status: 404 })
    if (path.endsWith('/')) file = join(file, 'index.html')
    if (!(await Bun.file(file).exists())) file = join(root, 'index.html')
    const responseHeaders: Record<string, string> = {
      'Content-Type': mime[extname(file)] ?? 'application/octet-stream',
    }
    if (extname(file) === '.html')
      responseHeaders['Content-Security-Policy'] =
        path === '/bloom-preview.html' ? policies[1] : policies[0]
    if (path.startsWith('/assets/')) responseHeaders['Access-Control-Allow-Origin'] = '*'
    return new Response(Bun.file(file), { headers: responseHeaders })
  },
})
const origin = `http://localhost:${server.port}`
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
  args: process.env.CHROME_EXECUTABLE ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
})
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage()
const invariant = (value: unknown, message: string) => {
  if (!value) throw new Error(message)
}
try {
  // Third-party services are outside this UI gate; the app's fetch fallbacks remain exercised.
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  )
  await page.goto(`${origin}/brand/`)
  await page.getByRole('heading', { name: 'Technology belongs to people.' }).waitFor()
  await page.getByRole('button', { name: 'Support', exact: true }).click()
  await page
    .getByRole('heading', { name: 'Your message has not been sent.', exact: true })
    .waitFor()
  await page.getByRole('button', { name: 'Orange recipe', exact: true }).click()
  invariant(
    (await page.getByTestId('brand-colour-composition').getAttribute('data-recipe')) === 'orange',
    'Colour studio did not apply the selected recipe',
  )
  console.log('PASS brand guide: chapters, voice examples and recipes')

  await page.goto(`${origin}/developers/docs/bloom/components/`)
  await page.getByPlaceholder('Search buttons, navigation, forms…').fill('button')
  await page.getByRole('link', { name: 'Button', exact: true }).waitFor()
  invariant(
    (await page.getByText('Example pending', { exact: true }).count()) === 0,
    'Empty preview tiles remain',
  )
  await page.getByRole('link', { name: 'Open playground', exact: true }).click()
  const frame = page.frameLocator('iframe[title="Interactive Bloom preview"]')
  await frame.getByRole('button', { name: 'Click me', exact: true }).waitFor({ timeout: 60000 })
  await page.getByLabel('children', { exact: true }).fill('A working Bloom button')
  await frame.getByRole('button', { name: 'A working Bloom button', exact: true }).waitFor()
  await page.getByLabel('Recipe', { exact: true }).selectOption('grove')
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark')
  invariant(
    new URL(page.url()).searchParams.get('recipe') === 'grove',
    'Recipe did not persist in URL',
  )
  await page.getByText('Example source', { exact: true }).click()
  await page
    .getByLabel('Bloom example source')
    .fill(
      `export default function Example() { let isolated = false; try { window.parent.document.body } catch { isolated = true }; return <p>{isolated ? 'Isolated preview works' : 'Isolation failed'}</p> }`,
    )
  await frame.getByText('Isolated preview works', { exact: true }).waitFor()
  await page.getByLabel('Bloom example source').fill('export default function Broken( {')
  await frame.getByText('Showing the last version that compiled.').waitFor()
  await page.getByRole('button', { name: 'Reset example', exact: true }).click()
  await frame.getByRole('button', { name: 'Click me', exact: true }).waitFor()
  console.log('PASS playground: controls, URL recipe, isolated code execution, errors and reset')

  await page.goto(`${origin}/inbox/`)
  await page.getByRole('heading', { name: 'Email. Room to think.' }).waitFor()
  await page.getByLabel('Search example messages').fill('Saturday')
  await page.getByRole('button', { name: /Sam.*See you on Saturday/ }).click()
  await page.getByLabel('Try a reply').fill('See you there.')
  await page.getByRole('button', { name: 'Preview reply', exact: true }).click()
  await page.getByText('Example reply added. No message was sent.').waitFor()
  console.log('PASS Inbox: search, conversation and local reply illustration')

  for (const path of [
    '/brand/',
    '/inbox/',
    '/developers/docs/bloom/components/',
    '/developers/docs/bloom/playground/',
  ]) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${origin}${path}`)
    await page.locator('h1').first().waitFor()
    invariant(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      `Horizontal overflow at ${path}`,
    )
  }
  console.log('PASS mobile layout: brand, Inbox, catalog and playground')
} finally {
  await browser.close()
  server.stop(true)
}
