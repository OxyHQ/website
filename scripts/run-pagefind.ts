#!/usr/bin/env bun
/**
 * run-pagefind.ts — invoke Pagefind only when there is something to index.
 *
 * Defense-in-depth wrapper for the deploy pipeline. Pagefind hard-crashes
 * (exit 1) when the directory it's pointed at contains no HTML files. That
 * is the *correct* behavior for a search indexer in isolation, but it
 * breaks production deploys whenever the docs-content tree is empty (no
 * registry entries resolved, sync-docs skipped, etc.).
 *
 * Resolution: walk `dist/docs-content/` for `.html` files first. If we find
 * any, shell out to `pagefind --site dist`. If we don't, log a warning and
 * exit 0 so the rest of the deploy proceeds — the site will just ship
 * without search.
 */

import { existsSync } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..');
const DIST = path.join(WEBSITE_ROOT, 'dist');
const DOCS_CONTENT = path.join(DIST, 'docs-content');

async function hasAnyHtml(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return false;
  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(dir, { recursive: true });
  } catch (err) {
    console.warn(`[run-pagefind] could not read ${dir}:`, err);
    return false;
  }
  for (const name of entries) {
    if (typeof name === 'string' && name.toLowerCase().endsWith('.html')) {
      return true;
    }
  }
  return false;
}

async function main(): Promise<void> {
  if (!existsSync(DIST)) {
    console.warn('[run-pagefind] dist/ does not exist — skipping Pagefind.');
    return;
  }
  const indexable = await hasAnyHtml(DOCS_CONTENT);
  if (!indexable) {
    console.warn(
      '[run-pagefind] no docs HTML found under dist/docs-content — skipping Pagefind. ' +
        'The site will deploy without search.',
    );
    return;
  }
  console.error('[run-pagefind] running Pagefind on dist/ ...');
  const result = spawnSync('bunx', ['pagefind', '--site', 'dist'], {
    cwd: WEBSITE_ROOT,
    stdio: 'inherit',
  });
  if (result.error) {
    console.error('[run-pagefind] failed to spawn pagefind:', result.error);
    process.exit(1);
  }
  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
  await removeIndexStubs();
}

/**
 * The `*-content` stub trees (docs-content, help-content, …) exist only so
 * Pagefind has full-text HTML to index at build time. Once `dist/pagefind/` is
 * written they're dead weight — and Cloudflare would otherwise serve them as
 * unstyled public pages (e.g. `/docs-content/...`). Remove them so the deploy
 * ships only the index; search results already point at the real SPA routes.
 */
async function removeIndexStubs(): Promise<void> {
  const entries = await readdir(DIST, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.endsWith('-content')) {
      await rm(path.join(DIST, entry.name), { recursive: true, force: true });
      console.error(`[run-pagefind] removed build-only stubs: dist/${entry.name}/`);
    }
  }
}

main().catch((err) => {
  console.error('[run-pagefind] fatal:', err);
  process.exit(1);
});
