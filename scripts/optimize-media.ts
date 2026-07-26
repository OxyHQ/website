/**
 * One-shot media optimizer for committed source assets.
 *
 * `vite-plugin-image-optimizer` already recompresses images on the way into
 * `dist/`, but recompression cannot fix the actual problems here, which are
 * about *dimensions and codecs*, not compression level:
 *
 *  - `hero-background.mp4` was HEVC at 3320×2160 / 240 fps. Chrome and Firefox
 *    do not decode HEVC in MP4 on most platforms, so the site's hero video
 *    silently never played for most visitors — they saw the poster and paid
 *    2.7 MB for a file the browser threw away.
 *  - Product videos were 2000 px wide at 60 fps, rendered into a card a few
 *    hundred pixels across.
 *  - `agents-features-icons.svg` was 1.75 MB because it embeds two base64 PNGs
 *    (one 1920×1975) that are drawn into 80×80 rects. SVGO cannot help: the
 *    payload is raster data, not path data.
 *
 * So this rewrites the sources in place, and the result is committed. It runs
 * by hand (`bun scripts/optimize-media.ts`), not in the build: re-encoding is
 * slow, lossy, and must not silently re-run on every CI build — a second lossy
 * pass over an already-encoded file just degrades it.
 *
 * Idempotent: every target declares what "already optimized" looks like
 * (dimensions, codec, format), and matching files are skipped. Re-running is a
 * no-op, which is what makes it safe to run again after adding one new asset.
 *
 * ffmpeg is resolved from `FFMPEG_PATH` or `PATH`. It is deliberately not a
 * dependency of this repo: a ~70 MB binary in `bun install` would be paid by
 * every CI run, for a script CI never invokes.
 */
import { readFile, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dir, '..')

/* ── ffmpeg ───────────────────────────────────────────────────────── */

function resolveFfmpeg(): { ffmpeg: string; ffprobe: string } | null {
  const fromEnv = process.env.FFMPEG_PATH
  const candidates = fromEnv ? [fromEnv] : ['ffmpeg']
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['-version'], { encoding: 'utf8' })
    if (probe.status === 0) {
      // Playwright ships a stripped ffmpeg (`--disable-everything`) with no
      // H.264 support. Encoding with it produces silent garbage, so reject it.
      if (!probe.stdout.includes('enable-gpl') && probe.stdout.includes('playwright-build')) {
        console.warn(`[media] ${candidate} is Playwright's stripped ffmpeg (no H.264) — skipping video`)
        return null
      }
      const ffprobe = candidate.replace(/ffmpeg([^/]*)$/, 'ffprobe$1')
      return { ffmpeg: candidate, ffprobe }
    }
  }
  return null
}

function run(bin: string, args: string[]): void {
  const result = spawnSync(bin, args, { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`${path.basename(bin)} failed: ${result.stderr?.slice(-600) ?? result.error?.message}`)
  }
}

interface VideoInfo {
  codec: string
  width: number
  height: number
  fps: number
  durationSec: number
}

function probeVideo(ffprobe: string, file: string): VideoInfo | null {
  const result = spawnSync(
    ffprobe,
    [
      '-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name,width,height,r_frame_rate',
      '-show_entries', 'format=duration',
      '-of', 'default=nw=1:nk=1', file,
    ],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) return null
  const [codec, width, height, rate, duration] = result.stdout.trim().split('\n')
  const [num, den] = (rate ?? '0/1').split('/').map(Number)
  return {
    codec,
    width: Number(width),
    height: Number(height),
    fps: den ? num / den : 0,
    durationSec: Number(duration) || 0,
  }
}

/**
 * Bits per pixel per frame — the only size measure that is comparable across
 * clips of different resolution, frame rate and length.
 *
 * Dimensions and codec alone are not enough to decide "already optimized":
 * `hero-video.mp4` was correctly H.264 at 1280×720/24fps and still 3.9 MB for
 * eight seconds, because it was encoded at roughly 0.18 bpp. x264 at the CRF
 * used here lands around 0.03–0.08, so anything above this threshold is worth
 * a pass regardless of how right its other properties look.
 */
const MAX_BITS_PER_PIXEL = 0.12

function bitsPerPixel(info: VideoInfo, fileBytes: number): number {
  const pixelsPerSecond = info.width * info.height * info.fps
  if (!pixelsPerSecond || !info.durationSec) return 0
  return (fileBytes * 8) / info.durationSec / pixelsPerSecond
}

/* ── Targets ──────────────────────────────────────────────────────── */

interface VideoTarget {
  file: string
  /** Longest edge, in CSS pixels at 2× the largest rendered size. */
  maxWidth: number
  fps: number
  /** x264 quality. 23 is visually transparent; these are decorative loops. */
  crf: number
}

const VIDEOS: VideoTarget[] = [
  // Full-bleed hero background. Was HEVC/3320×2160/240fps.
  { file: 'public/images/landing/hero-background.mp4', maxWidth: 1920, fps: 30, crf: 30 },
  // Hero carousel slot.
  { file: 'public/images/landing/hero-video.mp4', maxWidth: 1280, fps: 24, crf: 30 },
  // /ai product loops, rendered inside cards.
  { file: 'public/ai/catch-up.mp4', maxWidth: 1400, fps: 30, crf: 30 },
  { file: 'public/ai/managed-inbox.mp4', maxWidth: 1400, fps: 30, crf: 30 },
  { file: 'public/ai/evening-briefing.mp4', maxWidth: 1400, fps: 30, crf: 30 },
  { file: 'public/ai/morning-briefing-start.mp4', maxWidth: 1400, fps: 30, crf: 30 },
  { file: 'public/ai/morning-briefing-results.mp4', maxWidth: 1400, fps: 30, crf: 30 },
  { file: 'public/ai/todo.mp4', maxWidth: 1400, fps: 30, crf: 30 },
  { file: 'public/ai/todo-assign-ai.mp4', maxWidth: 1400, fps: 30, crf: 30 },
]

/** Videos that also need a VP9 `.webm` sibling, because markup lists one. */
const WEBM_SIBLINGS = new Set(['public/images/landing/hero-background.mp4'])

interface ImageTarget {
  file: string
  maxWidth: number
  /** Re-encode to this format; omit to keep the current one. */
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
  quality?: number
}

/**
 * "Already small enough", in bytes per pixel, per output format.
 *
 * A raw byte threshold cannot express this: 120 kB is bloated for an avatar and
 * excellent for a 2560 px banner. Worse, a byte threshold made this script
 * *non-idempotent* — every file above it was re-encoded on every run, so each
 * pass re-compressed already-compressed output and lost a little more quality.
 * Bytes per pixel is scale-free, so a file this script produced always tests as
 * done on the next run.
 */
const BYTES_PER_PIXEL_CEILING: Record<'webp' | 'avif' | 'jpeg' | 'png', number> = {
  jpeg: 0.25,
  webp: 0.25,
  avif: 0.15,
  png: 0.35,
}

/**
 * Never re-encode a file already this small. Per-pixel budgets do not hold at
 * small sizes — a 160×160 PNG with an alpha channel is legitimately over the
 * PNG ceiling and would be re-encoded forever, shedding a kilobyte and some
 * quality each time. A floor is safe where a ceiling is not: encoding only ever
 * shrinks a file, so anything under the floor stays under it.
 */
const SKIP_BELOW_BYTES = 24_000

const IMAGES: ImageTarget[] = [
  // 5260×3507 for a full-width banner.
  { file: 'public/images/landing/team-banner.jpg', maxWidth: 2560, format: 'jpeg', quality: 78 },
  // OG images are fetched by crawlers that do not all speak WebP; the spec size
  // is 1200×630 and anything larger is discarded on the other end anyway.
  { file: 'public/og-default.png', maxWidth: 1200, format: 'png' },
  { file: 'public/images/landing/agents-features-bg.webp', maxWidth: 1600, format: 'webp', quality: 78 },
  // The homepage hero poster — the LCP element on the busiest page.
  { file: 'public/images/landing/hero-bg.avif', maxWidth: 1600, format: 'avif', quality: 62 },
  { file: 'public/images/landing/partnerships-banner.avif', maxWidth: 1600, format: 'avif', quality: 62 },
  { file: 'public/images/astro/hero-bg.jpg', maxWidth: 1600, format: 'jpeg', quality: 78 },
  { file: 'public/images/landing/faircoin-store.png', maxWidth: 1400, format: 'png' },
  { file: 'public/images/faircoin/wallet-hero.jpg', maxWidth: 1920, format: 'jpeg', quality: 78 },
  { file: 'public/images/screenshots/inbox-app.png', maxWidth: 1600, format: 'png' },
  { file: 'public/images/screenshots/mention-app.png', maxWidth: 1600, format: 'png' },
  { file: 'public/images/apps/clarity.png', maxWidth: 1200, format: 'png' },
  { file: 'public/images/astro/cursor.png', maxWidth: 1200, format: 'png' },
  { file: 'public/ai/cta-desktop-bg.png', maxWidth: 1920, format: 'png' },
  { file: 'public/ai/shadow-bg.png', maxWidth: 1920, format: 'png' },
  // Avatars rendered at ~40 px.
  { file: 'src/assets/mention/avatar-joan.jpg', maxWidth: 160, format: 'jpeg', quality: 82 },
  { file: 'src/assets/mention/avatar-athina.jpg', maxWidth: 160, format: 'jpeg', quality: 82 },
  { file: 'src/assets/mention/avatar-vecna.png', maxWidth: 160, format: 'png' },
  { file: 'src/assets/mention/post-nate.jpg', maxWidth: 1200, format: 'jpeg', quality: 80 },
  { file: 'src/assets/mention/post-oxy.jpg', maxWidth: 1200, format: 'jpeg', quality: 80 },
  { file: 'src/assets/mention/post-oxy2.jpg', maxWidth: 1200, format: 'jpeg', quality: 80 },
  // Photographs, so JPEG. These shipped as PNG, which is why a single rental
  // listing photo weighed 535 kB; the extension change is why the imports in
  // `src/components/{homiio,mention}/data.ts` reference `.jpg`.
  { file: 'src/assets/homiio/roger-lluria.jpg', maxWidth: 1200, format: 'jpeg', quality: 82 },
]

/**
 * SVGs whose weight is embedded raster data. `maxRasterWidth` is the pixel size
 * to downscale each embedded bitmap to — 2× the size the `<rect>` draws it at.
 */
const RASTER_SVGS: Array<{ file: string; maxRasterWidth: number }> = [
  { file: 'public/images/landing/agents-features-icons.svg', maxRasterWidth: 160 },
]

/* ── Reporting ────────────────────────────────────────────────────── */

let savedBytes = 0
const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} kB`

async function sizeOf(file: string): Promise<number> {
  return (await stat(file)).size
}

function report(label: string, before: number, after: number): void {
  const delta = before - after
  savedBytes += delta
  const pct = before ? ((delta / before) * 100).toFixed(0) : '0'
  console.log(`  ${label.padEnd(52)} ${kb(before).padStart(9)} → ${kb(after).padStart(9)}  (-${pct}%)`)
}

/* ── Video ────────────────────────────────────────────────────────── */

async function optimizeVideo(tools: { ffmpeg: string; ffprobe: string }, target: VideoTarget): Promise<void> {
  const abs = path.join(ROOT, target.file)
  if (!existsSync(abs)) return console.log(`  ${target.file}: missing, skipped`)

  const info = probeVideo(tools.ffprobe, abs)
  if (!info) return console.log(`  ${target.file}: unreadable, skipped`)

  const currentBytes = await sizeOf(abs)
  const bpp = bitsPerPixel(info, currentBytes)
  const alreadyDone =
    info.codec === 'h264' &&
    info.width <= target.maxWidth &&
    info.fps <= target.fps + 1 &&
    bpp > 0 &&
    bpp <= MAX_BITS_PER_PIXEL
  if (alreadyDone) {
    console.log(`  ${target.file}: already h264 ${info.width}px @${info.fps.toFixed(0)}fps ${bpp.toFixed(3)}bpp, skipped`)
  } else {
    const before = currentBytes
    const tmp = `${abs}.tmp.mp4`
    run(tools.ffmpeg, [
      '-y', '-i', abs,
      // `-2` keeps the height even (H.264 requires it) while preserving aspect.
      '-vf', `scale='min(${target.maxWidth},iw)':-2`,
      '-r', String(target.fps),
      '-an', // every one of these is a muted decorative loop
      '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
      '-crf', String(target.crf), '-preset', 'slow',
      // Lets the browser start playback before the whole file arrives.
      '-movflags', '+faststart',
      tmp,
    ])
    const after = await sizeOf(tmp)
    if (after >= before) {
      console.log(`  ${target.file}: re-encode not smaller, kept original`)
      await Bun.file(tmp).delete()
    } else {
      await writeFile(abs, await readFile(tmp))
      await Bun.file(tmp).delete()
      report(target.file, before, after)
    }
  }

  if (!WEBM_SIBLINGS.has(target.file)) return
  const webm = abs.replace(/\.mp4$/, '.webm')
  if (existsSync(webm)) return console.log(`  ${path.relative(ROOT, webm)}: present, skipped`)
  run(tools.ffmpeg, [
    '-y', '-i', abs,
    '-vf', `scale='min(${target.maxWidth},iw)':-2`,
    '-r', String(target.fps), '-an',
    '-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0', '-row-mt', '1', '-deadline', 'good',
    webm,
  ])
  console.log(`  ${path.relative(ROOT, webm)}: created (${kb(await sizeOf(webm))})`)
}

/* ── Images ───────────────────────────────────────────────────────── */

async function optimizeImage(target: ImageTarget): Promise<void> {
  const abs = path.join(ROOT, target.file)
  if (!existsSync(abs)) return console.log(`  ${target.file}: missing, skipped`)

  const before = await sizeOf(abs)
  const input = await readFile(abs)
  const meta = await sharp(input).metadata()
  const pixels = (meta.width ?? 0) * (meta.height ?? 0)
  const bytesPerPixel = pixels ? before / pixels : Infinity
  const withinBudget =
    bytesPerPixel <= BYTES_PER_PIXEL_CEILING[target.format ?? 'jpeg'] || before <= SKIP_BELOW_BYTES
  if ((meta.width ?? 0) <= target.maxWidth && withinBudget) {
    return console.log(
      `  ${target.file}: already ${meta.width}px / ${bytesPerPixel.toFixed(3)} B/px, skipped`,
    )
  }

  let pipeline = sharp(input).resize({ width: target.maxWidth, withoutEnlargement: true })
  switch (target.format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality: target.quality ?? 80, progressive: true, mozjpeg: true })
      break
    case 'webp':
      pipeline = pipeline.webp({ quality: target.quality ?? 80, effort: 6 })
      break
    case 'avif':
      pipeline = pipeline.avif({ quality: target.quality ?? 65, effort: 6 })
      break
    case 'png':
      // Palette quantization is where the win is on screenshots and UI art.
      pipeline = pipeline.png({ compressionLevel: 9, palette: true, quality: target.quality ?? 90 })
      break
  }

  const output = await pipeline.toBuffer()
  if (output.length >= before) {
    return console.log(`  ${target.file}: re-encode not smaller, kept original`)
  }
  await writeFile(abs, output)
  report(target.file, before, output.length)
}

/* ── SVGs carrying embedded rasters ───────────────────────────────── */

async function optimizeRasterSvg(target: { file: string; maxRasterWidth: number }): Promise<void> {
  const abs = path.join(ROOT, target.file)
  if (!existsSync(abs)) return console.log(`  ${target.file}: missing, skipped`)

  const before = await sizeOf(abs)
  const source = await readFile(abs, 'utf8')

  const matches = [...source.matchAll(/data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)/g)]
  if (matches.length === 0) return console.log(`  ${target.file}: no embedded rasters, skipped`)

  let out = source
  for (const match of matches) {
    const [full, , b64] = match
    const buf = Buffer.from(b64, 'base64')
    const meta = await sharp(buf).metadata()
    if ((meta.width ?? 0) <= target.maxRasterWidth) continue
    const resized = await sharp(buf)
      .resize({ width: target.maxRasterWidth, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer()
    out = out.replace(full, `data:image/png;base64,${resized.toString('base64')}`)
  }

  if (out === source) return console.log(`  ${target.file}: rasters already small, skipped`)
  await writeFile(abs, out, 'utf8')
  report(target.file, before, Buffer.byteLength(out))
}

/* ── Main ─────────────────────────────────────────────────────────── */

const tools = resolveFfmpeg()

console.log('\nVideos')
if (!tools) {
  console.log('  ffmpeg not found — set FFMPEG_PATH or install ffmpeg. Skipping all video targets.')
} else {
  for (const target of VIDEOS) await optimizeVideo(tools, target)
}

console.log('\nImages')
for (const target of IMAGES) await optimizeImage(target)

console.log('\nSVGs with embedded rasters')
for (const target of RASTER_SVGS) await optimizeRasterSvg(target)

console.log(`\nTotal saved: ${kb(savedBytes)}\n`)
