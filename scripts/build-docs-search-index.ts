#!/usr/bin/env bun
/**
 * build-docs-search-index.ts — emit a flat directory of static HTML stubs,
 * one per docs page, for Pagefind to index.
 *
 * The website itself is a pure SPA, so there's no SSR/SSG output for
 * Pagefind to crawl. Rather than introduce a full SSR pipeline, we render a
 * minimal HTML shell per synced MDX page — just enough content for Pagefind
 * to extract the title, headings, and prose. Clicking a Pagefind result
 * navigates to the SPA route (`/developers/docs/<package>/<version>/<slug>`),
 * which does the real React rendering.
 *
 * Output lands at `dist/docs-content/<package>/<version>/<slug>.html`.
 * `pagefind --site dist` then walks `dist/` and emits `dist/pagefind/`.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { SyncedIndex } from './types.ts';

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..');
const SYNCED_INDEX = path.join(WEBSITE_ROOT, 'src', 'content', '_synced', 'index.json');
const DIST = path.join(WEBSITE_ROOT, 'dist');
const OUT_DIR = path.join(DIST, 'docs-content');

interface FrontMatter {
  title?: string;
  description?: string;
}

function parseFrontMatter(source: string): { data: FrontMatter; body: string } {
  if (!source.startsWith('---\n')) return { data: {}, body: source };
  const end = source.indexOf('\n---', 4);
  if (end < 0) return { data: {}, body: source };
  const fmBlock = source.slice(4, end);
  const body = source.slice(end + 4).replace(/^\r?\n/, '');
  const data: FrontMatter = {};
  for (const line of fmBlock.split('\n')) {
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key === 'title' || key === 'description') data[key] = val;
  }
  return { data, body };
}

/**
 * Cheap MD/MDX → plain-text-ish HTML conversion. Strips JSX elements,
 * preserves headings, paragraphs, lists, and inline code. Pagefind only
 * needs to extract content for indexing — visual fidelity is not the goal.
 */
function mdxToHtml(body: string): string {
  // Drop JSX-style component blocks (`<Foo .../>` and `<Foo>...</Foo>`).
  const stripped = body
    .replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*\/>/g, '')
    .replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/g, '')
    // Drop ``` fenced code blocks entirely from search index (noise).
    .replace(/```[\s\S]*?```/g, '');

  const lines = stripped.split('\n');
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      out.push('');
      continue;
    }
    let m: RegExpExecArray | null;
    if ((m = /^(#{1,6})\s+(.+)$/.exec(trimmed)) !== null) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      const level = m[1]?.length ?? 1;
      out.push(`<h${level}>${escapeHtml(m[2] ?? '')}</h${level}>`);
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${escapeHtml(trimmed.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    out.push(`<p>${escapeHtml(trimmed)}</p>`);
  }
  if (inList) out.push('</ul>');
  return out.join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapHtml(title: string, body: string, canonicalUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<meta name="pagefind-body" />
<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
<meta data-pagefind-meta="route[content]" content="${escapeHtml(canonicalUrl)}" />
</head>
<body>
<main data-pagefind-body>
${body}
</main>
</body>
</html>
`;
}

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function readSyncedIndex(): Promise<SyncedIndex | null> {
  if (!existsSync(SYNCED_INDEX)) return null;
  try {
    const raw = await readFile(SYNCED_INDEX, 'utf8');
    return JSON.parse(raw) as SyncedIndex;
  } catch (err) {
    console.error('[build-docs-search-index] failed to read synced index:', err);
    return null;
  }
}

/* ─── Help / Academy / Company content walker ─── */

/**
 * A single content surface to index — help, academy, or company. Each entry
 * results in one HTML stub file under `dist/<outSubdir>/` so Pagefind sees
 * it as a discrete document.
 */
interface ContentSurface {
  /** Source directory under `src/content`. */
  sourceDir: string;
  /** Output subdirectory under `dist/`. */
  outSubdir: string;
  /** Section label written alongside the title for grouping in search UI. */
  section: string;
  /** Builds the canonical URL the SPA navigates to when a result is clicked. */
  buildCanonical: (relativeFile: string) => string | null;
}

/**
 * Walk a directory recursively and yield every `.mdx` file relative to
 * `root`. Locale variants (e.g. `foo.es.mdx`) are skipped — Pagefind only
 * indexes the default-locale copy. Default-locale files are those without a
 * `.{2-letter-locale}` suffix before `.mdx`.
 */
async function* walkMdxFiles(root: string): AsyncGenerator<string> {
  if (!existsSync(root)) return;
  const entries = await readdir(root, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.mdx')) continue;
    // Skip locale variants — `welcome.es.mdx` matches; `welcome.mdx` does not.
    if (/\.[a-z]{2}\.mdx$/.test(entry.name)) continue;
    // Node 22 gives entries with `parentPath`; older give `path`.
    const parent = (entry as { parentPath?: string; path?: string }).parentPath
      ?? (entry as { parentPath?: string; path?: string }).path
      ?? root;
    const absolute = path.join(parent, entry.name);
    yield path.relative(root, absolute);
  }
}

/** Build the slug used in the canonical URL — strips `.mdx` from the path. */
function slugFromRelativePath(relativeFile: string): string {
  return relativeFile.replace(/\.mdx$/, '').replace(/\\/g, '/');
}

const CONTENT_SURFACES: ContentSurface[] = [
  {
    sourceDir: path.join(WEBSITE_ROOT, 'src', 'content', 'help'),
    outSubdir: 'help-content',
    section: 'Help',
    buildCanonical: (relativeFile) => {
      const slug = slugFromRelativePath(relativeFile);
      return slug ? `/help/${slug}` : null;
    },
  },
  {
    sourceDir: path.join(WEBSITE_ROOT, 'src', 'content', 'academy'),
    outSubdir: 'academy-content',
    section: 'Academy',
    buildCanonical: (relativeFile) => {
      const slug = slugFromRelativePath(relativeFile);
      // Academy lessons live at `<course>/<lesson>`. Top-level files (none
      // expected today) are skipped — they'd not have a renderable route.
      if (!slug.includes('/')) return null;
      return `/academy/${slug}`;
    },
  },
  {
    sourceDir: path.join(WEBSITE_ROOT, 'src', 'content', 'company'),
    outSubdir: 'company-content',
    section: 'Company',
    buildCanonical: (relativeFile) => {
      const slug = slugFromRelativePath(relativeFile);
      // Only the known prose pages have routes today. Any new MDX file under
      // `content/company/` without a route will simply not be indexed.
      const known = new Set(['manifesto', 'transparency', 'business']);
      return known.has(slug) ? `/company/${slug}` : null;
    },
  },
];

async function indexContentSurface(surface: ContentSurface): Promise<number> {
  let written = 0;
  for await (const relativeFile of walkMdxFiles(surface.sourceDir)) {
    const absolute = path.join(surface.sourceDir, relativeFile);
    const source = await readFile(absolute, 'utf8');
    const { data, body } = parseFrontMatter(source);
    const title = data.title ?? relativeFile.replace(/\.mdx$/, '');
    const canonical = surface.buildCanonical(relativeFile);
    if (!canonical) continue;
    const html = mdxToHtml(body);
    const slug = slugFromRelativePath(relativeFile);
    const dest = path.join(WEBSITE_ROOT, 'dist', surface.outSubdir, `${slug}.html`);
    await ensureDir(path.dirname(dest));
    await writeFile(dest, wrapHtml(`${title} — ${surface.section}`, html, canonical));
    written += 1;
  }
  return written;
}

const NEWSROOM_API = 'https://website-api.oxy.so/api/newsroom?limit=500';
// Slugs become file paths *and* URLs, so only accept safe characters — defends
// the build against a malformed or hostile slug from the API (path traversal,
// stray HTML in the canonical URL, etc.).
const SAFE_SLUG = /^[a-z0-9-]+$/i;

interface NewsroomPost {
  slug: string;
  title: string;
  description?: string;
  resume?: string;
  status?: string;
}

/**
 * Index the CMS-driven newsroom (blog). Posts aren't MDX on disk, so fetch the
 * published list from the live API and emit one stub per post — same Pagefind
 * pipeline as the MDX surfaces, just sourced over the network.
 */
async function indexNewsroom(): Promise<number> {
  let posts: NewsroomPost[];
  try {
    const res = await fetch(NEWSROOM_API);
    if (!res.ok) {
      console.warn(`[build-docs-search-index] newsroom API returned ${res.status} — skipping blog.`);
      return 0;
    }
    const data = (await res.json()) as { posts?: NewsroomPost[] };
    posts = (data.posts ?? []).filter((p) => SAFE_SLUG.test(p.slug ?? '') && (p.status ?? 'published') === 'published');
  } catch (err) {
    console.warn('[build-docs-search-index] newsroom fetch failed — skipping blog:', (err as Error).message);
    return 0;
  }
  let written = 0;
  for (const post of posts) {
    const body = `<p>${escapeHtml(post.description ?? post.resume ?? post.title)}</p>`;
    const dest = path.join(WEBSITE_ROOT, 'dist', 'newsroom-content', `${post.slug}.html`);
    await ensureDir(path.dirname(dest));
    await writeFile(dest, wrapHtml(`${post.title} — Newsroom`, body, `/newsroom/${post.slug}`));
    written += 1;
  }
  return written;
}

async function main(): Promise<void> {
  if (!existsSync(DIST)) {
    console.error('[build-docs-search-index] dist/ does not exist — skipping.');
    return;
  }
  const index = await readSyncedIndex();
  if (!index) {
    console.error('[build-docs-search-index] synced index missing — skipping.');
    return;
  }
  await ensureDir(OUT_DIR);
  let total = 0;
  for (const pkg of index.packages) {
    const isVersioned = pkg.versioned === true;
    for (const ver of pkg.versions) {
      // Disk segment — non-versioned packages skip the version dir so
      // Pagefind URLs match the SPA routes 1:1.
      const versionDirSegment = isVersioned ? ver.version : '';
      // Canonical URL always points at the latest version of this slug so
      // search engines de-duplicate stale results onto the up-to-date
      // page. Non-versioned packages have no version segment at all.
      const buildCanonical = (slug: string): string => {
        if (!isVersioned) {
          return slug
            ? `/developers/docs/${pkg.shortName}/${slug}`
            : `/developers/docs/${pkg.shortName}`;
        }
        return slug
          ? `/developers/docs/${pkg.shortName}/${pkg.latestVersion}/${slug}`
          : `/developers/docs/${pkg.shortName}/${pkg.latestVersion}`;
      };
      for (const page of ver.pages) {
        const syncedFile = path.join(WEBSITE_ROOT, 'src', 'content', '_synced', page.file);
        if (!existsSync(syncedFile)) continue;
        const source = await readFile(syncedFile, 'utf8');
        const { data, body } = parseFrontMatter(source);
        const title = data.title ?? page.title;
        const html = mdxToHtml(body);
        const slugPath = page.slug ? `${page.slug}.html` : 'index.html';
        const dest = versionDirSegment
          ? path.join(OUT_DIR, pkg.shortName, versionDirSegment, slugPath)
          : path.join(OUT_DIR, pkg.shortName, slugPath);
        const canonical = buildCanonical(page.slug);
        await ensureDir(path.dirname(dest));
        await writeFile(dest, wrapHtml(`${title} — ${pkg.displayName}`, html, canonical));
        total += 1;
      }
    }
  }
  // Index help / academy / company MDX surfaces too — same Pagefind pipeline.
  for (const surface of CONTENT_SURFACES) {
    const written = await indexContentSurface(surface);
    console.error(
      `[build-docs-search-index] wrote ${written} ${surface.section} pages to dist/${surface.outSubdir}/.`,
    );
    total += written;
  }
  // Newsroom (blog) — CMS content fetched at build time, not MDX on disk.
  const newsroomWritten = await indexNewsroom();
  console.error(`[build-docs-search-index] wrote ${newsroomWritten} Newsroom posts to dist/newsroom-content/.`);
  total += newsroomWritten;
  // Sanity check: walk what we just wrote.
  const written = await readdir(OUT_DIR, { recursive: true });
  console.error(
    `[build-docs-search-index] wrote ${total} pages total (${written.length} entries under ${OUT_DIR}).`,
  );
}

main().catch((err) => {
  console.error('[build-docs-search-index] fatal:', err);
  process.exit(1);
});
