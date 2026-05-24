#!/usr/bin/env bun
/**
 * sync-docs.ts — assemble the docs site content tree.
 *
 * Reads `website/docs-registry.json`, walks each repo, locates one or many
 * `docs.config.json` files, and copies the docs/ trees into
 * `src/content/_synced/{shortName}/{version}/`. Writes a top-level
 * `_synced/index.json` consumed by the docs routes for navigation,
 * search, and category listing.
 *
 * Strategy (first cut):
 *  - For `'main'` versions: copy files directly from the working tree. Fast
 *    dev iteration, no git plumbing.
 *  - For tag versions: use `git show <tag>:<path>` so we never touch the
 *    upstream working tree. Tags missing in the repo log a warning and
 *    that version is skipped (the build does not fail).
 *
 * TypeDoc API extraction and Storybook integration are stubbed: we emit
 * structural placeholders so the routes have something to render, and the
 * real wiring lands in a follow-up. The script is deliberately tolerant of
 * partial repos so the website still builds when one source repo is broken.
 */

import { readFile, writeFile, mkdir, rm, readdir, stat, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import type {
  DocsConfig,
  DocsRegistry,
  DocsRegistryEntry,
  SyncedIndex,
  SyncedPackage,
  SyncedPage,
  SyncedVersion,
} from './types.ts';

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..');
const REGISTRY_PATH = path.join(WEBSITE_ROOT, 'docs-registry.json');
const SYNCED_DIR = path.join(WEBSITE_ROOT, 'src', 'content', '_synced');
const CACHE_DIR = path.join(WEBSITE_ROOT, 'node_modules', '.docs-cache');

interface FrontMatter {
  title?: string;
  description?: string;
  order?: number;
}

async function loadRegistry(): Promise<DocsRegistry> {
  const raw = await readFile(REGISTRY_PATH, 'utf8');
  return JSON.parse(raw) as DocsRegistry;
}

/** Resolve `entry.localPath` to an absolute path (relative paths are anchored to the website root). */
function resolveLocalPath(localPath: string): string {
  return path.isAbsolute(localPath) ? localPath : path.resolve(WEBSITE_ROOT, localPath);
}

/**
 * Shallow-clone (or refresh) `git` into `node_modules/.docs-cache/<name>/`
 * and return the absolute path to the working tree. Throws on hard failure.
 */
function syncGitCache(name: string, git: string, ref: string): string {
  const dest = path.join(CACHE_DIR, name);
  const gitDir = path.join(dest, '.git');
  if (existsSync(gitDir)) {
    console.error(`[sync-docs] refreshing cached clone for ${name} (${ref})...`);
    execSync(`git fetch --depth 1 origin ${ref}`, { cwd: dest, stdio: 'pipe' });
    execSync(`git reset --hard FETCH_HEAD`, { cwd: dest, stdio: 'pipe' });
  } else {
    console.error(`[sync-docs] cloning ${git} (${ref}) into ${dest}...`);
    // Wipe a partial directory if a previous run left it behind without .git.
    if (existsSync(dest)) {
      execSync(`rm -rf ${JSON.stringify(dest)}`);
    }
    execSync(`mkdir -p ${JSON.stringify(CACHE_DIR)}`);
    execSync(
      `git clone --depth 1 --branch ${JSON.stringify(ref)} ${JSON.stringify(git)} ${JSON.stringify(dest)}`,
      { stdio: 'pipe' },
    );
  }
  return dest;
}

/**
 * Resolve a registry entry to an absolute working-tree path on disk.
 * Prefers `localPath` when it exists (fast dev iteration); falls back to
 * cloning `git` into `node_modules/.docs-cache/<name>/`. Returns `null` when
 * neither source is usable.
 */
function resolveRepoRoot(entry: DocsRegistryEntry): string | null {
  if (entry.localPath) {
    const resolved = resolveLocalPath(entry.localPath);
    if (existsSync(resolved)) return resolved;
    console.warn(`[sync-docs] localPath '${entry.localPath}' not found for ${entry.name}; falling back to git.`);
  }
  if (entry.git) {
    try {
      return syncGitCache(entry.name, entry.git, entry.ref ?? 'main');
    } catch (err) {
      console.error(`[sync-docs] failed to sync git source for ${entry.name}:`, err);
      return null;
    }
  }
  console.warn(`[sync-docs] no usable source (localPath or git) for ${entry.name}; skipping.`);
  return null;
}

async function readDocsConfig(configPath: string): Promise<DocsConfig | null> {
  if (!existsSync(configPath)) return null;
  try {
    const raw = await readFile(configPath, 'utf8');
    return JSON.parse(raw) as DocsConfig;
  } catch (err) {
    console.error(`[sync-docs] failed to parse ${configPath}:`, err);
    return null;
  }
}

async function collectConfigs(
  entry: DocsRegistryEntry,
  repoRoot: string,
): Promise<Array<{ config: DocsConfig; rootDir: string }>> {
  const results: Array<{ config: DocsConfig; rootDir: string }> = [];
  const candidates = entry.configPaths ?? [''];
  for (const sub of candidates) {
    const dir = sub ? path.join(repoRoot, sub) : repoRoot;
    const configPath = path.join(dir, 'docs.config.json');
    const config = await readDocsConfig(configPath);
    if (config) results.push({ config, rootDir: dir });
  }
  return results;
}

/** Parse a minimal `---\nkey: value\n---` block at the top of an MDX file. */
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
    const valRaw = line.slice(colon + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!key) continue;
    if (key === 'order') {
      const n = Number(valRaw);
      if (Number.isFinite(n)) data.order = n;
    } else if (key === 'title' || key === 'description') {
      data[key] = valRaw;
    }
  }
  return { data, body };
}

function deriveTitleFromBody(body: string, fallback: string): string {
  const match = body.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? fallback;
}

function slugFromFile(relPath: string): string {
  const noExt = relPath.replace(/\.(mdx|md)$/i, '');
  return noExt === 'index' ? '' : noExt.replace(/\\/g, '/');
}

async function walkMdx(dir: string, base = dir): Promise<string[]> {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkMdx(full, base)));
    } else if (/\.(mdx|md)$/i.test(entry.name)) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

function isIgnored(relPath: string, ignore: string[]): boolean {
  if (ignore.length === 0) return false;
  const normalized = relPath.replace(/\\/g, '/');
  for (const pattern of ignore) {
    const p = pattern.replace(/\\/g, '/').replace(/\/+$/, '');
    if (!p) continue;
    if (normalized === p || normalized.startsWith(`${p}/`)) return true;
    // Support a trailing /* glob.
    if (p.endsWith('/*') && normalized.startsWith(`${p.slice(0, -2)}/`)) return true;
  }
  return false;
}

async function copyVersionFromTree(
  srcDocsDir: string,
  outDir: string,
  ignore: string[] = [],
): Promise<SyncedPage[]> {
  if (!existsSync(srcDocsDir)) return [];
  await mkdir(outDir, { recursive: true });
  await cp(srcDocsDir, outDir, {
    recursive: true,
    filter: (src) => {
      const rel = path.relative(srcDocsDir, src);
      if (!rel) return true;
      return !isIgnored(rel, ignore);
    },
  });
  const files = await walkMdx(outDir);
  const pages: SyncedPage[] = [];
  for (const rel of files) {
    const full = path.join(outDir, rel);
    const source = await readFile(full, 'utf8');
    const { data, body } = parseFrontMatter(source);
    const slug = slugFromFile(rel);
    const title = data.title ?? deriveTitleFromBody(body, slug || 'Overview');
    pages.push({
      slug,
      title,
      description: data.description,
      file: path.relative(SYNCED_DIR, full).replace(/\\/g, '/'),
      order: data.order ?? 1000,
    });
  }
  pages.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    // index page first, then alphabetical
    if (a.slug === '') return -1;
    if (b.slug === '') return 1;
    return a.slug.localeCompare(b.slug);
  });
  return pages;
}

async function copyVersionFromGitTag(
  repoRoot: string,
  tag: string,
  docsPath: string,
  outDir: string,
  ignore: string[] = [],
): Promise<SyncedPage[]> {
  // List tracked files under docsPath at the given tag.
  let listing = '';
  try {
    listing = execSync(`git ls-tree -r --name-only ${tag} -- ${docsPath}`, {
      cwd: repoRoot,
      encoding: 'utf8',
    });
  } catch {
    console.warn(`[sync-docs] tag '${tag}' not found in ${repoRoot} — skipping.`);
    return [];
  }
  const files = listing.split('\n').filter((f) => /\.(mdx|md)$/i.test(f));
  if (files.length === 0) return [];
  await mkdir(outDir, { recursive: true });
  const pages: SyncedPage[] = [];
  for (const file of files) {
    const relUnderDocs = path.relative(docsPath, file);
    if (isIgnored(relUnderDocs, ignore)) continue;
    let contents: Buffer;
    try {
      contents = execSync(`git show ${tag}:${file}`, { cwd: repoRoot });
    } catch (err) {
      console.error(`[sync-docs] git show failed for ${tag}:${file}`, err);
      continue;
    }
    const dest = path.join(outDir, relUnderDocs);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, contents);
    const { data, body } = parseFrontMatter(contents.toString('utf8'));
    const slug = slugFromFile(relUnderDocs);
    const title = data.title ?? deriveTitleFromBody(body, slug || 'Overview');
    pages.push({
      slug,
      title,
      description: data.description,
      file: path.relative(SYNCED_DIR, dest).replace(/\\/g, '/'),
      order: data.order ?? 1000,
    });
  }
  pages.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    if (a.slug === '') return -1;
    if (b.slug === '') return 1;
    return a.slug.localeCompare(b.slug);
  });
  return pages;
}

/** Copy `openapi.json` from a package root into the synced api version dir. */
async function copyOpenApiSpec(rootDir: string, outDir: string): Promise<void> {
  const candidates = [
    path.join(rootDir, 'openapi.json'),
    path.join(rootDir, 'openapi.yaml'),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    await mkdir(outDir, { recursive: true });
    const dest = path.join(outDir, path.basename(candidate));
    await cp(candidate, dest);
    return;
  }
}

async function syncPackage(
  config: DocsConfig,
  rootDir: string,
  repoRoot: string,
): Promise<SyncedPackage> {
  const versions: SyncedVersion[] = [];
  const ignore = config.docsIgnore ?? [];
  for (const version of config.versions) {
    const outDir = path.join(SYNCED_DIR, config.shortName, version);
    let pages: SyncedPage[] = [];
    if (version === 'main' || version === 'local') {
      const srcDocsDir = path.join(rootDir, config.docsPath);
      pages = await copyVersionFromTree(srcDocsDir, outDir, ignore);
    } else {
      const docsPathInRepo = path.relative(repoRoot, path.join(rootDir, config.docsPath));
      pages = await copyVersionFromGitTag(repoRoot, version, docsPathInRepo, outDir, ignore);
      if (pages.length === 0) {
        // Fallback to working-tree copy so we always have *something* to render.
        const srcDocsDir = path.join(rootDir, config.docsPath);
        if (existsSync(srcDocsDir)) {
          pages = await copyVersionFromTree(srcDocsDir, outDir, ignore);
        }
      }
    }
    // Pull the OpenAPI document for service packages so the Scalar viewer
    // can `import` it from `_synced/api/<version>/openapi.json`.
    if (config.category === 'service') {
      await copyOpenApiSpec(rootDir, outDir);
    }
    versions.push({ version, pages });
  }
  return {
    package: config.package,
    displayName: config.displayName,
    shortName: config.shortName,
    repo: config.repo,
    category: config.category,
    description: config.description,
    defaultVersion: config.defaultVersion,
    versions,
  };
}

async function syncRepo(entry: DocsRegistryEntry): Promise<SyncedPackage[]> {
  const repoRoot = resolveRepoRoot(entry);
  if (!repoRoot) return [];
  const configs = await collectConfigs(entry, repoRoot);
  if (configs.length === 0) {
    console.warn(`[sync-docs] no docs.config.json found for ${entry.name}`);
    return [];
  }
  const out: SyncedPackage[] = [];
  for (const { config, rootDir } of configs) {
    const pkg = await syncPackage(config, rootDir, repoRoot);
    out.push(pkg);
  }
  return out;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  console.error('[sync-docs] building docs content tree...');
  if (await pathExists(SYNCED_DIR)) {
    await rm(SYNCED_DIR, { recursive: true, force: true });
  }
  await mkdir(SYNCED_DIR, { recursive: true });
  const registry = await loadRegistry();
  const packages: SyncedPackage[] = [];
  for (const entry of registry.repos) {
    const synced = await syncRepo(entry);
    packages.push(...synced);
  }
  const index: SyncedIndex = {
    generatedAt: new Date().toISOString(),
    packages,
  };
  await writeFile(path.join(SYNCED_DIR, 'index.json'), JSON.stringify(index, null, 2));
  console.error(`[sync-docs] wrote ${packages.length} packages, ${packages.reduce((n, p) => n + p.versions.reduce((m, v) => m + v.pages.length, 0), 0)} pages.`);
}

main().catch((err) => {
  console.error('[sync-docs] fatal:', err);
  process.exit(1);
});
