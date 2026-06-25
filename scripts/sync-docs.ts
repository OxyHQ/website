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

import { readFile, writeFile, mkdir, rm, readdir, rename, cp } from 'node:fs/promises';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
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
    execFileSync('git', ['fetch', '--depth', '1', 'origin', ref], { cwd: dest, stdio: 'pipe' });
    execFileSync('git', ['reset', '--hard', 'FETCH_HEAD'], { cwd: dest, stdio: 'pipe' });
  } else {
    console.error(`[sync-docs] cloning ${git} (${ref}) into ${dest}...`);
    // Wipe a partial directory if a previous run left it behind without .git.
    if (existsSync(dest)) {
      rmSync(dest, { recursive: true, force: true });
    }
    mkdirSync(CACHE_DIR, { recursive: true });
    execFileSync('git', ['clone', '--depth', '1', '--branch', ref, git, dest], { stdio: 'pipe' });
  }
  // Fetch tag refs so per-version `git show <tag>:<file>` works.
  // `--depth 1 --branch` clones only the branch tip and skips tags by default.
  // Untagged repos (Mention, Allo, Homiio, Clarity, this repo for the MCP
  // docs, …) make this exit non-zero with empty stderr — that's expected and
  // must not break the sync of the rest of the registry.
  try {
    execFileSync('git', ['fetch', '--depth', '1', 'origin', 'refs/tags/*:refs/tags/*'], { cwd: dest, stdio: 'pipe' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (process.env.SYNC_DOCS_DEBUG === '1') {
      console.warn(`[sync-docs] no tag refs fetched for ${name}: ${message.split('\n')[0]}`);
    }
    // No tags to fetch — fine. Per-version syncs against this repo will be
    // skipped at the `versions` loop with a warning. Untagged repos rely on
    // the `main`/`master` ref instead.
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
    if (entry.git) {
      console.warn(`[sync-docs] localPath '${entry.localPath}' not found for ${entry.name}; falling back to git.`);
    }
  }
  if (entry.git) {
    try {
      return syncGitCache(entry.name, entry.git, entry.ref ?? 'main');
    } catch (err) {
      console.error(`[sync-docs] failed to sync git source for ${entry.name}:`, err);
      return null;
    }
  }
  if (entry.skipIfNoLocal) {
    console.error(`[sync-docs] no localPath for ${entry.name} and skipIfNoLocal is set; skipping.`);
    return null;
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

/**
 * Rewrite legacy /docs/... references to the canonical /developers/docs/...
 * route used by this website. Source repos authored their MDX against the
 * older route scheme; we normalize on the way in so synced content matches
 * what the SPA actually serves. Handles both markdown link targets
 * (the ](path) form) and bold link captions (the [**path**] form).
 */
function rewriteDocsLinks(source: string): string {
  return (
    source
      // Link captions like `[**/docs/api**]` or `[/docs/x]` — the bracketed
      // display text that authors hand-write to mirror the URL.
      .replace(/(\[(?:\*\*)?)\/docs(\/[^\]\s)]*?)((?:\*\*)?\])/g, '$1/developers/docs$2$3')
      // Link targets like `](/docs/...)`.
      .replace(/(\]\()\/docs(\/|\))/g, '$1/developers/docs$2')
  );
}

async function rewriteMdxLinksInPlace(filePath: string): Promise<void> {
  const original = await readFile(filePath, 'utf8');
  const rewritten = rewriteDocsLinks(original);
  if (rewritten !== original) {
    await writeFile(filePath, rewritten);
  }
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
    await rewriteMdxLinksInPlace(full);
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

/**
 * `'main'` and `'master'` are working-tree refs (or development branches),
 * not pinned releases. Versioned packages may still list them so the
 * "latest dev preview" stays browsable; non-versioned packages always use
 * one of them. We special-case both so sync-docs never tries to resolve
 * them as semver tags.
 */
function isWorkingTreeVersion(version: string): boolean {
  return version === 'main' || version === 'master' || version === 'local';
}

/**
 * Resolve a version string to the actual git tag in the source repo.
 *
 * Convention (documented in `scripts/README.md`): tags are
 * `@oxyhq/<package>@<version>` for npm-scoped packages, or `<package>@<version>`
 * / `v<version>` as fallbacks for non-scoped repos (Mention, Allo, etc.).
 *
 * We try candidates in order and return the first one that exists. Returns
 * `null` if none match — the caller then warns and skips that version
 * entirely (no fallback to the working tree; duplicating "latest" content
 * under every missing version would be misleading).
 */
function resolveVersionTag(repoRoot: string, pkg: string, version: string): string | null {
  // If the caller passed a literal tag (e.g. `'v1.2.3'`), prefer the
  // longer-form candidates first but accept the raw string too.
  const candidates: string[] = [];
  const scopedOrPlain = pkg.startsWith('@') ? pkg : pkg.toLowerCase();
  candidates.push(`${scopedOrPlain}@${version}`);
  // Non-scoped lowercase mirror for repos that publish unscoped (e.g. `tnp`).
  if (pkg.startsWith('@')) {
    candidates.push(`${pkg.toLowerCase()}@${version}`);
  }
  candidates.push(`v${version}`);
  candidates.push(version);

  for (const tag of candidates) {
    try {
      execFileSync('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`], {
        cwd: repoRoot,
        stdio: 'pipe',
      });
      return tag;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (process.env.SYNC_DOCS_DEBUG === '1') {
        console.warn(`[sync-docs] tag candidate '${tag}' did not resolve: ${message.split('\n')[0]}`);
      }
    }
  }
  return null;
}

async function copyVersionFromGitTag(
  repoRoot: string,
  tag: string,
  docsPath: string,
  outDir: string,
  ignore: string[] = [],
): Promise<SyncedPage[]> {
  // List tracked files under docsPath at the given tag.
  let listing: string;
  try {
    listing = execFileSync('git', ['ls-tree', '-r', '--name-only', tag, '--', docsPath], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[sync-docs] tag '${tag}' not found in ${repoRoot} — skipping: ${message.split('\n')[0]}`);
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
      contents = execFileSync('git', ['show', `${tag}:${file}`], { cwd: repoRoot });
    } catch (err) {
      console.error(`[sync-docs] git show failed for ${tag}:${file}`, err);
      continue;
    }
    const dest = path.join(outDir, relUnderDocs);
    await mkdir(path.dirname(dest), { recursive: true });
    const rewritten = rewriteDocsLinks(contents.toString('utf8'));
    await writeFile(dest, rewritten);
    const { data, body } = parseFrontMatter(rewritten);
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

/* ------------------------------ TypeDoc ------------------------------- */

/**
 * Walk upwards from `startDir` to find the nearest `tsconfig.json`. Used
 * when a package's own `tsconfig.json` is missing — some monorepos only
 * carry a root `tsconfig.json` that the packages extend.
 */
function findNearestTsconfig(startDir: string, stopAt: string): string | null {
  let current = path.resolve(startDir);
  const stop = path.resolve(stopAt);
  // Walk up until we cross above `stopAt` (the repo root). Guard against
  // infinite loops with a manual step count.
  for (let i = 0; i < 12; i += 1) {
    const candidate = path.join(current, 'tsconfig.json');
    if (existsSync(candidate)) return candidate;
    if (current === stop || current === path.dirname(current)) return null;
    current = path.dirname(current);
  }
  return null;
}

/**
 * Strip the front-matter / "title:" lines TypeDoc emits to make pages render
 * cleanly inside the docs shell. The shell already shows the page title.
 */
function normalizeTypedocMarkdown(source: string): string {
  let body = source;
  // Drop the leading `**@oxyhq/foo**\n\n***\n\n` block typedoc-plugin-markdown
  // prepends to every file — it's a no-op breadcrumb that just creates noise.
  body = body.replace(/^\*\*[^*\n]+\*\*\n\n\*\*\*\n\n/, '');
  // Some pages prepend a `[**@oxyhq/foo**](../README.md)\n\n***\n\n` link.
  body = body.replace(/^\[\*\*[^*\n]+\*\*\]\([^)]+\)\n\n\*\*\*\n\n/, '');
  // Drop the breadcrumb line `[@oxyhq/foo](href) / SymbolName` that the link
  // rewriter leaves behind. Followed by a blank line.
  body = body.replace(/^\[[^\]]+\]\([^)]+\)\s*\/\s*[^\n]+\n+/, '');
  return body;
}

/**
 * Convert relative `.md`/`.mdx` links between TypeDoc-generated files to
 * absolute docs URLs that the SPA router understands. Without this, links
 * like `[Foo](../interfaces/Foo.md)` would 404 inside the docs shell.
 *
 * `fileRelativeDir` is the source file's directory relative to the api/
 * root (e.g. `'interfaces'`, `''`). It anchors `../` and `./` resolution.
 */
function rewriteTypedocLinks(source: string, pkgBaseUrl: string, fileRelativeDir: string): string {
  // Match markdown link targets that point at a `.md` file with an optional
  // anchor: `](./foo.md)`, `](../bar/baz.md#anchor)`, etc.
  return source.replace(
    /\]\(((?!https?:|mailto:|#)[^)\s]+\.mdx?)(#[^)]*)?\)/g,
    (_match, target: string, anchor: string | undefined) => {
      const targetUnix = target.replace(/\\/g, '/');
      // Resolve `../foo/bar.md` against the source file's directory, so the
      // final URL doesn't carry literal `..` segments through to the router.
      const fromDir = fileRelativeDir ? `/${fileRelativeDir}/` : '/';
      const resolved = path.posix.normalize(`${fromDir}${targetUnix}`).replace(/^\/+/, '');
      const noExt = resolved.replace(/\.(mdx?|md)$/i, '');
      // README → the api/ index page (empty trailing slug).
      const slug = noExt.replace(/\/?README$/i, '').replace(/\/?index$/i, '');
      const href = slug ? `${pkgBaseUrl}/${slug}` : pkgBaseUrl;
      return `](${href}${anchor ?? ''})`;
    },
  );
}

/**
 * List the curated Bloom demo names by scanning
 * `src/content/bloom-demos/<Name>.tsx`. Used by the sync to decide which
 * Bloom typedoc pages should get a live `<BloomDemo>` block prepended.
 */
async function loadBloomDemoNames(): Promise<Set<string>> {
  const demosDir = path.join(WEBSITE_ROOT, 'src', 'content', 'bloom-demos');
  if (!existsSync(demosDir)) return new Set<string>();
  const entries = await readdir(demosDir);
  const out = new Set<string>();
  for (const file of entries) {
    const match = file.match(/^([A-Z][^./]*)\.tsx$/);
    if (match && match[1]) out.add(match[1]);
  }
  return out;
}

/**
 * Insert a `<BloomDemo name="..." />` block right after the page's H1 in a
 * typedoc-generated markdown file. If no H1 is present, the demo is
 * prepended at the top.
 */
function injectBloomDemo(source: string, demoName: string): string {
  const block = `<BloomDemo name="${demoName}" />\n\n`;
  const h1 = source.match(/^# .+$/m);
  if (!h1 || h1.index === undefined) return `${block}${source}`;
  const insertAt = h1.index + h1[0].length;
  return `${source.slice(0, insertAt)}\n\n${block}${source.slice(insertAt).replace(/^\n+/, '')}`;
}

/** Write a friendly title to the top of an API page so the sidebar surfaces it. */
function deriveTypedocTitle(filePath: string, source: string): string {
  // TypeDoc emits `# Interface: Foo`, `# Class: Bar`, `# Function: baz()`.
  const headingMatch = source.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].replace(/^(Interface|Class|Function|Type Alias|Variable|Module|Namespace):\s+/, '').trim();
  }
  return path.basename(filePath, path.extname(filePath));
}

/**
 * Invoke TypeDoc to extract API reference markdown for a single package
 * version. The output lands at `<outDir>/api/` so it routes under
 * `/developers/docs/<pkg>/<version>/api/...`. On failure (missing tsconfig,
 * broken types, plugin error) we log a warning and return an empty array
 * so the rest of the sync still succeeds.
 */
async function runTypedoc(
  config: DocsConfig,
  rootDir: string,
  repoRoot: string,
  outDir: string,
  version: string,
): Promise<SyncedPage[]> {
  const typedoc = config.typedoc;
  if (!typedoc?.entry) return [];

  const entryAbs = path.resolve(rootDir, typedoc.entry);
  if (!existsSync(entryAbs)) {
    console.warn(`[sync-docs] typedoc entry '${entryAbs}' not found for ${config.shortName}@${version}; skipping API reference.`);
    return [];
  }

  const tsconfigAbs = findNearestTsconfig(rootDir, repoRoot);
  if (!tsconfigAbs) {
    console.warn(`[sync-docs] no tsconfig.json found near ${rootDir}; skipping API reference for ${config.shortName}@${version}.`);
    return [];
  }

  const apiOutDir = path.join(outDir, 'api');
  // Reset the api/ subtree so stale pages from earlier runs don't linger.
  if (existsSync(apiOutDir)) {
    await rm(apiOutDir, { recursive: true, force: true });
  }
  await mkdir(apiOutDir, { recursive: true });

  const typedocBin = path.join(WEBSITE_ROOT, 'node_modules', 'typedoc', 'bin', 'typedoc');
  if (!existsSync(typedocBin)) {
    console.warn(`[sync-docs] typedoc not installed at ${typedocBin}; run \`bun install\` in website/. Skipping API reference.`);
    return [];
  }

  // The flat `kind` router groups output into `classes/`, `interfaces/`,
  // `functions/`, `types/`, `variables/`, `modules/` — keeping slugs clean
  // and free of `@scope/` segments.
  const args = [
    '--entryPoints', entryAbs,
    '--out', apiOutDir,
    '--plugin', 'typedoc-plugin-markdown',
    '--readme', 'none',
    '--tsconfig', tsconfigAbs,
    '--router', 'kind',
    '--skipErrorChecking',
    '--hideGenerator',
    '--disableSources',
  ];

  try {
    execFileSync('node', [typedocBin, ...args], {
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '0' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[sync-docs] typedoc failed for ${config.shortName}@${version}:`, message.split('\n')[0]);
    return [];
  }

  // Post-process every generated markdown file: rewrite relative links,
  // strip the TypeDoc breadcrumb noise, then record a `SyncedPage` entry.
  const files = await walkMdx(apiOutDir);
  if (files.length === 0) {
    console.warn(`[sync-docs] typedoc produced no markdown for ${config.shortName}@${version}.`);
    return [];
  }

  const pkgBaseUrl = `/developers/docs/${config.shortName}/${version}/api`;
  // For Bloom, look up which curated demos exist so we can prepend a live
  // `<BloomDemo>` block to the matching typedoc function page. Skipped for
  // other packages; demos are a Bloom-only concept today.
  const bloomDemoNames =
    config.shortName === 'bloom' ? await loadBloomDemoNames() : new Set<string>();
  const pages: SyncedPage[] = [];
  for (const rel of files) {
    const full = path.join(apiOutDir, rel);
    const raw = await readFile(full, 'utf8');
    const fileRelativeDir = path.dirname(rel).replace(/\\/g, '/');
    const dir = fileRelativeDir === '.' ? '' : fileRelativeDir;
    let cleaned = normalizeTypedocMarkdown(rewriteTypedocLinks(raw, pkgBaseUrl, dir));
    // Track whether we injected JSX MDX components — if so the file needs the
    // `.mdx` extension so the MDX plugin actually compiles the embedded JSX.
    // Leaving typedoc's stock pages as `.md` avoids parsing failures on prose
    // that happens to contain `{ ... }` literals (common in TS prop docs).
    let injectedMdx = false;
    // Bloom overview gets a visual component hub grid prepended. The grid is
    // a custom MDX component (registered in `mdxComponentMap.tsx`) that reads
    // the bloom-demos registry and renders one card per demoed component with
    // light/dark thumbnails captured by `scripts/render-bloom-thumbnails.ts`.
    if (config.shortName === 'bloom' && /(^|\/)README\.mdx?$/i.test(rel)) {
      cleaned = `<BloomHubGrid />\n\n${cleaned}`;
      injectedMdx = true;
    }
    // Prepend a live `<BloomDemo>` block on Bloom API pages that map to a
    // curated demo. The demo name is the file's basename without extension —
    // for namespaced symbols (`Tabs.Tab.md`) we also try the prefix before
    // the first dot so sub-symbols still surface the parent component's
    // live demo (`<BloomDemo name="Tabs" />` for `Tabs.Tab`, etc.).
    if (config.shortName === 'bloom' && bloomDemoNames.size > 0) {
      const baseName = path.basename(rel, path.extname(rel));
      const directHit = bloomDemoNames.has(baseName) ? baseName : null;
      const dotPrefix = baseName.includes('.') ? baseName.split('.')[0] : null;
      const indirectHit = directHit ?? (dotPrefix && bloomDemoNames.has(dotPrefix) ? dotPrefix : null);
      if (indirectHit) {
        cleaned = injectBloomDemo(cleaned, indirectHit);
        injectedMdx = true;
      }
    }
    // Rename the file from `.md` → `.mdx` only when we injected JSX. The
    // original `.md` is left under typedoc's emitted name and we redirect the
    // synced index entry to the `.mdx` copy.
    let outRel = rel;
    let outFull = full;
    if (injectedMdx && /\.md$/i.test(rel)) {
      outRel = rel.replace(/\.md$/i, '.mdx');
      outFull = path.join(apiOutDir, outRel);
      // Remove the original .md so we don't double-publish the same page.
      await rm(full, { force: true });
    }
    await writeFile(outFull, cleaned);
    // Slug is the file path under `outDir` (so `api/` is included).
    const slug = `api/${outRel.replace(/\\/g, '/').replace(/\.(mdx?|md)$/i, '')}`.replace(/\/README$/i, '').replace(/\/index$/i, '');
    const title = deriveTypedocTitle(outRel, cleaned);
    pages.push({
      slug,
      title,
      file: path.relative(SYNCED_DIR, outFull).replace(/\\/g, '/'),
      order: 10000, // Always sorts after hand-written guides (default 1000).
      section: 'api',
    });
  }

  pages.sort((a, b) => {
    // Index page (api/) first.
    if (a.slug === 'api') return -1;
    if (b.slug === 'api') return 1;
    return a.slug.localeCompare(b.slug);
  });
  return pages;
}

async function syncPackage(
  config: DocsConfig,
  rootDir: string,
  repoRoot: string,
): Promise<SyncedPackage> {
  const versions: SyncedVersion[] = [];
  const ignore = config.docsIgnore ?? [];
  const versioned = config.versioned === true;
  // Non-versioned packages may omit `versions[]` entirely — fall back to
  // `defaultVersion` (typically `'main'`) so they still produce a synced
  // tree. Versioned packages must list `versions[]` explicitly.
  const versionList =
    Array.isArray(config.versions) && config.versions.length > 0
      ? config.versions
      : [config.defaultVersion ?? 'main'];
  // Throttle the "no tag matched" warning — versioned packages with long
  // release histories spam the build log otherwise. Log the first one in
  // detail, then collapse the rest into a single summary line.
  let missingTagCount = 0;
  const missingTagSamples: string[] = [];
  for (const version of versionList) {
    const outDir = path.join(SYNCED_DIR, config.shortName, version);
    let pages: SyncedPage[];
    if (isWorkingTreeVersion(version) || !versioned) {
      // Working tree: read MDX directly off disk. This is the only path
      // for non-versioned packages (apps) and for the "dev preview" entry
      // on versioned packages.
      const srcDocsDir = path.join(rootDir, config.docsPath);
      pages = await copyVersionFromTree(srcDocsDir, outDir, ignore);
    } else {
      // Versioned tag: resolve to an actual git tag, then `git show` the
      // tree at that tag. If the tag isn't reachable from the working
      // tree, skip this version — duplicating the latest tree under every
      // missing version would be both misleading and slow (each version
      // would re-run TypeDoc against the same source).
      const resolvedTag = resolveVersionTag(repoRoot, config.package, version);
      if (!resolvedTag) {
        missingTagCount += 1;
        if (missingTagSamples.length < 3) missingTagSamples.push(version);
        // Skip this version — no content, no TypeDoc, no entry in the
        // synced index. The SPA naturally degrades: the version selector
        // hides versions with no pages, and any direct link to an
        // unreachable version redirects to `latestVersion`.
        continue;
      }
      const docsPathInRepo = path.relative(repoRoot, path.join(rootDir, config.docsPath));
      pages = await copyVersionFromGitTag(repoRoot, resolvedTag, docsPathInRepo, outDir, ignore);
    }
    // Pull the OpenAPI document for service packages so the Scalar viewer
    // can `import` it from `_synced/api/<version>/openapi.json`.
    if (config.category === 'service') {
      await copyOpenApiSpec(rootDir, outDir);
    }
    // Tag hand-written pages so the sidebar can group them under "Guides".
    for (const page of pages) {
      page.section = 'guides';
    }
    // Auto-generate TypeDoc API reference. We only run TypeDoc for the
    // configured `latestVersion` (or the lone version on non-versioned
    // packages) because TypeDoc reads from the *working tree* — running
    // it for every old version would document today's source under each
    // historical slug, which is both wrong and prohibitively slow (each
    // run takes 30-60s, and the services package has ~400 versions).
    const isApiTarget =
      isWorkingTreeVersion(version) ||
      version === (config.latestVersion ?? config.defaultVersion);
    if (isApiTarget) {
      const apiPages = await runTypedoc(config, rootDir, repoRoot, outDir, version);
      pages.push(...apiPages);
    }
    versions.push({ version, pages });
  }
  if (missingTagCount > 0) {
    console.warn(
      `[sync-docs] ${config.package}: ${missingTagCount} version(s) skipped (no matching git tag) — samples: ${missingTagSamples.join(', ')}.`,
    );
  }
  // Resolved latest version. Resolution order:
  //   1. Explicit `latestVersion` from the config, if it ended up being
  //      synced (i.e. its tag was reachable). Tag-pinned packages may
  //      list a `latestVersion` that's not reachable from the working
  //      tree — fall through in that case.
  //   2. The first successfully-synced version (versions[] preserves
  //      config order, which is "newest first" by convention).
  //   3. The legacy `defaultVersion` field.
  //   4. `'main'` as a last resort so consumers always have a non-empty
  //      string to render.
  const syncedSlugs = new Set(versions.map((v) => v.version));
  const latestVersion =
    (config.latestVersion && syncedSlugs.has(config.latestVersion)
      ? config.latestVersion
      : undefined) ??
    versions[0]?.version ??
    config.defaultVersion ??
    'main';
  return {
    package: config.package,
    displayName: config.displayName,
    shortName: config.shortName,
    repo: config.repo,
    category: config.category,
    description: config.description,
    defaultVersion: config.defaultVersion,
    versions,
    versioned,
    latestVersion,
    deprecatedVersions: config.deprecatedVersions ?? [],
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

async function main(): Promise<void> {
  console.error('[sync-docs] building docs content tree...');
  // Clean stale per-package trees, but keep `index.json` in place while we
  // rebuild. `docs-loader.ts` imports it statically, so it must never vanish
  // mid-build or Vite fails to resolve the import (`./_synced/index.json`).
  // The fresh index is swapped in atomically (temp + rename) at the end.
  await mkdir(SYNCED_DIR, { recursive: true });
  for (const entry of await readdir(SYNCED_DIR)) {
    if (entry === 'index.json') continue;
    await rm(path.join(SYNCED_DIR, entry), { recursive: true, force: true });
  }
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
  const indexPath = path.join(SYNCED_DIR, 'index.json');
  const tmpPath = `${indexPath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(index, null, 2));
  await rename(tmpPath, indexPath);
  console.error(`[sync-docs] wrote ${packages.length} packages, ${packages.reduce((n, p) => n + p.versions.reduce((m, v) => m + v.pages.length, 0), 0)} pages.`);
}

main().catch((err) => {
  console.error('[sync-docs] fatal:', err);
  process.exit(1);
});
