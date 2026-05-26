#!/usr/bin/env bun
/**
 * sync-changelog.ts — build-time GitHub releases sync.
 *
 * Fetches GitHub releases for each tracked OxyHQ repo and writes a single
 * static JSON file at `src/content/_changelog/index.json` that the public
 * `/changelog` page reads directly. Replaces the runtime `GET /api/changelog`
 * call, which doesn't work on Cloudflare Pages (no Express server deployed).
 *
 * Conditional requests via ETag (cached in `node_modules/.changelog-cache/`)
 * keep repeat builds fast and avoid burning the anonymous rate limit.
 * Set `GITHUB_TOKEN` in CI to lift the limit further.
 *
 * Set `CHANGELOG_REPOS=owner/name,owner/name` to override the default list.
 *
 * Admin DB (Mongo) is left untouched as future work.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const WEBSITE_ROOT = path.resolve(import.meta.dir, '..')
const OUTPUT_DIR = path.join(WEBSITE_ROOT, 'src', 'content', '_changelog')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.json')
const CACHE_DIR = path.join(WEBSITE_ROOT, 'node_modules', '.changelog-cache')

interface TrackedRepo {
  owner: string
  name: string
  displayName: string
}

/** Default repos tracked when `CHANGELOG_REPOS` is not set. */
const DEFAULT_REPOS: Array<{ slug: string; displayName: string }> = [
  { slug: 'OxyHQ/website', displayName: 'Website' },
  { slug: 'OxyHQ/OxyHQServices', displayName: 'Oxy SDK' },
  { slug: 'OxyHQ/Bloom', displayName: 'Bloom' },
  { slug: 'OxyHQ/Mention', displayName: 'Mention' },
  { slug: 'OxyHQ/Allo', displayName: 'Allo' },
  { slug: 'OxyHQ/Alia', displayName: 'Alia' },
  { slug: 'OxyHQ/Homiio', displayName: 'Homiio' },
  { slug: 'OxyHQ/tnp', displayName: 'TNP' },
  { slug: 'OxyHQ/Astro', displayName: 'Astro' },
]

/** Display-name overrides for repos provided via `CHANGELOG_REPOS`. */
const DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  DEFAULT_REPOS.map((r) => [r.slug.toLowerCase(), r.displayName]),
)

interface GitHubRelease {
  id: number
  tag_name: string
  name: string | null
  body: string | null
  draft: boolean
  prerelease: boolean
  published_at: string | null
  created_at: string
  html_url: string
}

interface ChangelogEntryStatic {
  _id: string
  title: string
  content: string
  tags: string[]
  date: string
  items: string[]
  media: null
  githubReleaseId: number
  repoOwner: string
  repoName: string
  repoDisplayName: string
  htmlUrl: string
  tagName: string
}

interface ChangelogIndex {
  generatedAt: string
  repos: TrackedRepo[]
  entries: ChangelogEntryStatic[]
}

interface RepoCache {
  etag: string
  /** Releases as returned by GitHub (raw), to replay on 304. */
  releases: GitHubRelease[]
}

function parseRepos(): TrackedRepo[] {
  const override = process.env.CHANGELOG_REPOS?.trim()
  const slugs = override
    ? override.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_REPOS.map((r) => r.slug)

  return slugs.map((slug) => {
    const [owner, name] = slug.split('/')
    if (!owner || !name) {
      throw new Error(`[sync-changelog] invalid repo slug: '${slug}' (expected 'owner/name')`)
    }
    const displayName = DISPLAY_NAMES[slug.toLowerCase()] ?? name
    return { owner, name, displayName }
  })
}

function cacheFilePath(owner: string, name: string): string {
  return path.join(CACHE_DIR, `${owner}-${name}.json`)
}

async function readCache(owner: string, name: string): Promise<RepoCache | null> {
  const file = cacheFilePath(owner, name)
  if (!existsSync(file)) return null
  try {
    const raw = await readFile(file, 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (
      parsed && typeof parsed === 'object'
      && 'etag' in parsed && typeof (parsed as RepoCache).etag === 'string'
      && 'releases' in parsed && Array.isArray((parsed as RepoCache).releases)
    ) {
      return parsed as RepoCache
    }
    return null
  } catch {
    return null
  }
}

async function writeCache(owner: string, name: string, cache: RepoCache): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true })
  await writeFile(cacheFilePath(owner, name), JSON.stringify(cache), 'utf8')
}

/**
 * Derive tag labels (Feature / Bug Fix / Breaking / etc.) from common GitHub
 * release body section headings. Falls back to `[]` for unstructured notes.
 */
function deriveTags(body: string | null | undefined): string[] {
  if (!body) return []
  const tags = new Set<string>()
  const lower = body.toLowerCase()
  // Match `## Section` or `### Section` headings (markdown) anywhere in body.
  const headingRegex = /(^|\n)#{2,3}\s+([^\n]+)/g
  let match: RegExpExecArray | null
  while ((match = headingRegex.exec(body)) !== null) {
    const heading = match[2]?.toLowerCase().trim() ?? ''
    if (/feat(ure)?s?\b/.test(heading)) tags.add('Feature')
    else if (/(bug ?fix(es)?|fixes|fixed|fix)\b/.test(heading)) tags.add('Bug Fix')
    else if (/break(ing)?\b/.test(heading)) tags.add('Breaking')
    else if (/enhancement|improvement/.test(heading)) tags.add('Enhancement')
    else if (/design|ui|style/.test(heading)) tags.add('Design')
    else if (/docs?|documentation/.test(heading)) tags.add('Docs')
    else if (/perf(ormance)?/.test(heading)) tags.add('Performance')
    else if (/security/.test(heading)) tags.add('Security')
  }
  // Conventional-commit style prefixes in the body lines (e.g. `* feat: ...`).
  if (tags.size === 0) {
    if (/(^|\n)\s*[-*+]?\s*feat(\([^)]+\))?:/i.test(lower)) tags.add('Feature')
    if (/(^|\n)\s*[-*+]?\s*fix(\([^)]+\))?:/i.test(lower)) tags.add('Bug Fix')
    if (/breaking change/i.test(lower)) tags.add('Breaking')
  }
  return Array.from(tags)
}

function normalize(
  release: GitHubRelease,
  owner: string,
  name: string,
  displayName: string,
): ChangelogEntryStatic {
  const title = (release.name && release.name.trim()) || release.tag_name
  const date = release.published_at ?? release.created_at
  return {
    _id: `gh-${release.id}`,
    title,
    content: release.body ?? '',
    tags: deriveTags(release.body),
    date,
    items: [],
    media: null,
    githubReleaseId: release.id,
    repoOwner: owner,
    repoName: name,
    repoDisplayName: displayName,
    htmlUrl: release.html_url,
    tagName: release.tag_name,
  }
}

interface FetchResult {
  releases: GitHubRelease[]
  /** True when the response came from the local cache via 304. */
  fromCache: boolean
}

async function fetchReleases(repo: TrackedRepo, token: string | undefined): Promise<FetchResult> {
  const cached = await readCache(repo.owner, repo.name)
  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/releases?per_page=50`
  const headers: Record<string, string> = {
    'User-Agent': 'oxy-website-changelog',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (cached?.etag) headers['If-None-Match'] = cached.etag
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })

  if (res.status === 304 && cached) {
    return { releases: cached.releases, fromCache: true }
  }

  if (res.status === 404) {
    console.warn(`[sync-changelog] ${repo.owner}/${repo.name}: repo not found (404), skipping`)
    return { releases: [], fromCache: false }
  }

  if (!res.ok) {
    const remaining = res.headers.get('x-ratelimit-remaining')
    const resetAt = res.headers.get('x-ratelimit-reset')
    const detail = remaining === '0'
      ? ` (rate limit exhausted, resets at ${resetAt ? new Date(Number(resetAt) * 1000).toISOString() : 'unknown'})`
      : ''
    // Fall back to cached releases if we have them, so the build still produces output.
    if (cached) {
      console.warn(
        `[sync-changelog] ${repo.owner}/${repo.name}: HTTP ${res.status}${detail}, using cached releases`,
      )
      return { releases: cached.releases, fromCache: true }
    }
    throw new Error(
      `[sync-changelog] ${repo.owner}/${repo.name}: HTTP ${res.status}${detail}`,
    )
  }

  const raw: unknown = await res.json()
  if (!Array.isArray(raw)) {
    throw new Error(`[sync-changelog] ${repo.owner}/${repo.name}: expected array response`)
  }

  // Filter out drafts and ensure shape we care about.
  const releases = (raw as GitHubRelease[]).filter((r) => !r.draft)
  const etag = res.headers.get('etag')
  if (etag) {
    await writeCache(repo.owner, repo.name, { etag, releases })
  }
  return { releases, fromCache: false }
}

async function main(): Promise<void> {
  const repos = parseRepos()
  const token = process.env.GITHUB_TOKEN?.trim() || undefined

  if (!token) {
    console.warn('[sync-changelog] no GITHUB_TOKEN set — anonymous rate limit applies (60 req/hr)')
  }

  await mkdir(OUTPUT_DIR, { recursive: true })

  const allEntries: ChangelogEntryStatic[] = []
  let cachedCount = 0

  for (const repo of repos) {
    try {
      const { releases, fromCache } = await fetchReleases(repo, token)
      if (fromCache) cachedCount += 1
      const entries = releases.map((r) => normalize(r, repo.owner, repo.name, repo.displayName))
      console.log(
        `[sync-changelog] ${repo.owner}/${repo.name}: ${entries.length} release(s)${fromCache ? ' (cached)' : ''}`,
      )
      allEntries.push(...entries)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[sync-changelog] ${repo.owner}/${repo.name}: ${msg}`)
    }
  }

  allEntries.sort((a, b) => {
    const da = new Date(a.date).getTime()
    const db = new Date(b.date).getTime()
    return db - da
  })

  const index: ChangelogIndex = {
    generatedAt: new Date().toISOString(),
    repos,
    entries: allEntries,
  }

  await writeFile(OUTPUT_FILE, JSON.stringify(index, null, 2), 'utf8')
  console.log(
    `[sync-changelog] wrote ${allEntries.length} entries from ${repos.length} repo(s) (${cachedCount} cached) -> ${path.relative(WEBSITE_ROOT, OUTPUT_FILE)}`,
  )
}

await main()
