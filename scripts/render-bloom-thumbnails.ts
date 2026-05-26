#!/usr/bin/env bun
/**
 * render-bloom-thumbnails.ts — capture Bloom component previews.
 *
 * For every demo registered under `src/content/bloom-demos/`, this script
 * opens the hidden `/developers/docs/_thumbnail/<Name>` route in headless
 * Chromium, takes a 400×300 screenshot at 2× DPR for both light and dark
 * themes, and writes the result to
 * `src/content/_synced/bloom/<version>/thumbnails/<Name>.{light,dark}.png`.
 *
 * Run locally only. CI consumes the committed PNGs.
 *
 * Usage:
 *   bun scripts/render-bloom-thumbnails.ts          # uses an existing dev server if running
 *   bun scripts/render-bloom-thumbnails.ts --port 5173
 *   bun scripts/render-bloom-thumbnails.ts --no-server  # don't spin one up
 *
 * Requirements:
 *   - `bun add -d playwright` (already in devDependencies)
 *   - `bunx playwright install chromium` once per machine
 *
 * The script auto-detects the latest Bloom version from the synced index
 * (`src/content/_synced/index.json`) so newly-released versions pick up
 * fresh thumbnails without touching the script.
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { spawn, type ChildProcessByStdio } from 'node:child_process'
import type { Readable } from 'node:stream'
import path from 'node:path'
import { setTimeout as wait } from 'node:timers/promises'

import type { Browser } from 'playwright'

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..')
const DEMOS_DIR = path.join(WEBSITE_ROOT, 'src', 'content', 'bloom-demos')
const SYNCED_INDEX = path.join(WEBSITE_ROOT, 'src', 'content', '_synced', 'index.json')
const VIEWPORT = { width: 400, height: 300 }
const DEVICE_SCALE_FACTOR = 2

interface CliArgs {
  port: number
  startServer: boolean
}

function parseArgs(argv: readonly string[]): CliArgs {
  let port = 5173
  let startServer = true
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--port') {
      const next = argv[i + 1]
      const parsed = next ? Number(next) : NaN
      if (Number.isFinite(parsed)) {
        port = parsed
        i++
      }
    } else if (arg === '--no-server') {
      startServer = false
    }
  }
  return { port, startServer }
}

interface BloomPackageMeta {
  shortName: string
  latestVersion: string
}

async function readBloomMeta(): Promise<BloomPackageMeta> {
  if (!existsSync(SYNCED_INDEX)) {
    throw new Error(
      `Missing ${SYNCED_INDEX}. Run \`bun scripts/sync-docs.ts\` first.`,
    )
  }
  const raw = await readFile(SYNCED_INDEX, 'utf8')
  const index = JSON.parse(raw) as {
    packages: Array<{ shortName: string; latestVersion: string }>
  }
  const bloom = index.packages.find((p) => p.shortName === 'bloom')
  if (!bloom) throw new Error('Bloom package not found in synced index.')
  return bloom
}

async function listDemos(): Promise<string[]> {
  if (!existsSync(DEMOS_DIR)) {
    throw new Error(`Missing demos directory: ${DEMOS_DIR}`)
  }
  const entries = await readdir(DEMOS_DIR)
  const demos = entries
    .filter((f) => /^[A-Z][^.]*\.tsx$/.test(f))
    .map((f) => f.replace(/\.tsx$/, ''))
  demos.sort()
  return demos
}

async function isServerLive(port: number): Promise<boolean> {
  try {
    const res = await fetch(`http://localhost:${port}/`, {
      signal: AbortSignal.timeout(1500),
    })
    return res.status < 500
  } catch {
    return false
  }
}

type DevServerProcess = ChildProcessByStdio<null, Readable, Readable>

interface ServerHandle {
  port: number
  proc: DevServerProcess | null
}

async function ensureServer(args: CliArgs): Promise<ServerHandle> {
  if (await isServerLive(args.port)) {
    console.error(`[thumbnails] using existing server on port ${args.port}.`)
    return { port: args.port, proc: null }
  }
  if (!args.startServer) {
    throw new Error(
      `No server detected on port ${args.port} and --no-server was passed.`,
    )
  }
  // We boot the *preview* (production) server rather than dev because Bloom's
  // barrel pulls in `react-native-svg` which trips Vite's dev-mode dep
  // optimizer; the production build resolves cleanly through the aliases in
  // `vite.config.ts`. The thumbnail script is meant to run after `bun run
  // build` anyway, so the prod artifact is fresh.
  console.error(`[thumbnails] starting preview server on port ${args.port}...`)
  const proc = spawn('bun', ['run', 'preview', '--', '--port', String(args.port)], {
    cwd: WEBSITE_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' },
  })
  proc.stdout.on('data', (d: Buffer) => {
    process.stderr.write(`[vite] ${d.toString()}`)
  })
  proc.stderr.on('data', (d: Buffer) => {
    process.stderr.write(`[vite] ${d.toString()}`)
  })
  // Wait up to 60s for the server to come up.
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    await wait(500)
    if (await isServerLive(args.port)) {
      console.error(`[thumbnails] preview server is live.`)
      return { port: args.port, proc }
    }
  }
  proc.kill('SIGTERM')
  throw new Error('Preview server failed to come up within 60s.')
}

async function captureDemo(
  browser: Browser,
  baseUrl: string,
  demoName: string,
  outDir: string,
  mode: 'light' | 'dark',
): Promise<string> {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    colorScheme: mode,
  })
  const page = await ctx.newPage()
  // Suppress console noise from the demo render — only re-emit errors.
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`[thumbnails][${demoName}/${mode}] ${msg.text()}`)
    }
  })
  const url = `${baseUrl}/developers/docs/_thumbnail/${demoName}?theme=${mode}`
  await page.goto(url, { waitUntil: 'load', timeout: 30_000 })
  // The thumbnail page wraps its content in a known marker element so we can
  // wait for hydration AND screenshot precisely that bounding box.
  const frame = page.locator('[data-thumbnail-frame]')
  await frame.waitFor({ state: 'visible', timeout: 15_000 })
  // Tiny settle window for fonts/styles to commit. Headless Chromium tends to
  // expose Inter swap-in artifacts otherwise.
  await wait(250)
  const outPath = path.join(outDir, `${demoName}.${mode}.png`)
  await frame.screenshot({ path: outPath, type: 'png' })
  await ctx.close()
  return outPath
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const bloom = await readBloomMeta()
  const demos = await listDemos()
  if (demos.length === 0) {
    console.error('[thumbnails] no demos found; nothing to do.')
    return
  }

  const outDir = path.join(
    WEBSITE_ROOT,
    'src',
    'content',
    '_synced',
    'bloom',
    bloom.latestVersion,
    'thumbnails',
  )
  await mkdir(outDir, { recursive: true })

  // Resolve Playwright lazily so the script still parses on machines where the
  // dependency isn't installed yet. We surface a friendly error instead of an
  // unhelpful resolver stack.
  let playwright: typeof import('playwright')
  try {
    playwright = await import('playwright')
  } catch {
    throw new Error(
      "Playwright not installed. Run `bun add -d playwright` and `bunx playwright install chromium`.",
    )
  }

  const server = await ensureServer(args)
  const baseUrl = `http://localhost:${server.port}`
  const browser = await playwright.chromium.launch({ headless: true })

  let captured = 0
  const errors: Array<{ demo: string; mode: 'light' | 'dark'; message: string }> = []
  try {
    for (const demo of demos) {
      for (const mode of ['light', 'dark'] as const) {
        try {
          const out = await captureDemo(browser, baseUrl, demo, outDir, mode)
          console.error(`[thumbnails] ${path.relative(WEBSITE_ROOT, out)}`)
          captured += 1
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          errors.push({ demo, mode, message })
          console.error(`[thumbnails] FAILED ${demo}/${mode}: ${message}`)
        }
      }
    }
  } finally {
    await browser.close()
    if (server.proc) {
      server.proc.kill('SIGTERM')
    }
  }

  console.error(
    `[thumbnails] wrote ${captured}/${demos.length * 2} (${demos.length} components × 2 modes) → ${path.relative(WEBSITE_ROOT, outDir)}`,
  )
  if (errors.length > 0) {
    console.error(`[thumbnails] ${errors.length} capture(s) failed.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[thumbnails] fatal:', err)
  process.exit(1)
})
