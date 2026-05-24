#!/usr/bin/env bun
/**
 * build-docs-search-index.ts — emit a flat directory of static HTML stubs,
 * one per docs page, for Pagefind to index.
 *
 * The website itself is a pure SPA, so there's no SSR/SSG output for
 * Pagefind to crawl. Rather than introduce a full SSR pipeline, we render a
 * minimal HTML shell per synced MDX page — just enough content for Pagefind
 * to extract the title, headings, and prose. Clicking a Pagefind result
 * navigates to the SPA route (`/docs/<package>/<version>/<slug>`), which
 * does the real React rendering.
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
    for (const ver of pkg.versions) {
      for (const page of ver.pages) {
        const syncedFile = path.join(WEBSITE_ROOT, 'src', 'content', '_synced', page.file);
        if (!existsSync(syncedFile)) continue;
        const source = await readFile(syncedFile, 'utf8');
        const { data, body } = parseFrontMatter(source);
        const title = data.title ?? page.title;
        const html = mdxToHtml(body);
        const slugPath = page.slug ? `${page.slug}.html` : 'index.html';
        const dest = path.join(OUT_DIR, pkg.shortName, ver.version, slugPath);
        const canonical = page.slug
          ? `/docs/${pkg.shortName}/${ver.version}/${page.slug}`
          : `/docs/${pkg.shortName}/${ver.version}`;
        await ensureDir(path.dirname(dest));
        await writeFile(dest, wrapHtml(`${title} — ${pkg.displayName}`, html, canonical));
        total += 1;
      }
    }
  }
  // Sanity check: walk what we just wrote.
  const written = await readdir(OUT_DIR, { recursive: true });
  console.error(
    `[build-docs-search-index] wrote ${total} pages to ${OUT_DIR} (${written.length} entries).`,
  );
}

main().catch((err) => {
  console.error('[build-docs-search-index] fatal:', err);
  process.exit(1);
});
