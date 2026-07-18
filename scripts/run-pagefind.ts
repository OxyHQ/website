#!/usr/bin/env bun
/**
 * run-pagefind.ts — invoke Pagefind only when there is something to index.
 *
 * Defense-in-depth wrapper for the deploy pipeline. Pagefind hard-crashes
 * (exit 1) when the directory it's pointed at contains no HTML files. That
 * is the *correct* behavior for a search indexer in isolation, but it
 * breaks production deploys whenever the stub trees are empty (no registry
 * entries resolved, sync-docs skipped, etc.).
 *
 * Resolution: walk every `dist/*-content/` stub tree for `.html` files first.
 * If we find any, shell out to `pagefind --site dist`. If we don't, log a
 * warning and exit 0 so the rest of the deploy proceeds — the site will just
 * ship without search. Either way the stubs are removed before we return.
 */

import { existsSync } from 'node:fs';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..');
const DIST = path.join(WEBSITE_ROOT, 'dist');

/**
 * The top-level `dist/*-content/` trees written by `build-docs-search-index.ts`
 * (docs-content, help-content, academy-content, company-content,
 * newsroom-content). Enumerated rather than hardcoded so a new content surface
 * is picked up automatically.
 */
async function listStubDirs(): Promise<string[]> {
  if (!existsSync(DIST)) return [];
  const entries = await readdir(DIST, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name.endsWith('-content'))
    .map((entry) => path.join(DIST, entry.name));
}

async function hasAnyHtml(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return false;
  let entries: string[];
  try {
    entries = await readdir(dir, { recursive: true });
  } catch (err) {
    console.warn(`[run-pagefind] could not read ${dir}:`, err);
    return false;
  }
  return entries.some((name) => name.toLowerCase().endsWith('.html'));
}

async function main(): Promise<void> {
  if (!existsSync(DIST)) {
    console.warn('[run-pagefind] dist/ does not exist — skipping Pagefind.');
    return;
  }

  let exitCode = 0;
  try {
    const stubDirs = await listStubDirs();
    let indexable = false;
    for (const dir of stubDirs) {
      if (await hasAnyHtml(dir)) {
        indexable = true;
        break;
      }
    }
    if (!indexable) {
      console.warn(
        '[run-pagefind] no HTML found under any dist/*-content tree — skipping Pagefind. ' +
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
      exitCode = 1;
      return;
    }
    if (typeof result.status === 'number' && result.status !== 0) {
      exitCode = result.status;
    }
  } finally {
    // Runs on every path — including the early "nothing to index" return and a
    // failed Pagefind run — so the stubs can never survive into `dist/`.
    await removeIndexStubs();
  }

  if (exitCode !== 0) process.exit(exitCode);
}

/**
 * The `*-content` stub trees (docs-content, help-content, …) exist only so
 * Pagefind has full-text HTML to index at build time. Once `dist/pagefind/` is
 * written they're dead weight — and Cloudflare would otherwise serve them as
 * unstyled public pages (e.g. `/docs-content/...`). Remove them so the deploy
 * ships only the index; search results already point at the real SPA routes.
 */
async function removeIndexStubs(): Promise<void> {
  for (const dir of await listStubDirs()) {
    await rm(dir, { recursive: true, force: true });
    console.error(`[run-pagefind] removed build-only stubs: dist/${path.basename(dir)}/`);
  }
}

main().catch((err) => {
  console.error('[run-pagefind] fatal:', err);
  process.exit(1);
});
