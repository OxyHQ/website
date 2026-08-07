import { config } from '../config.js'
import { eq, sql } from 'drizzle-orm'
import { db } from '../db/postgres.js'
import { changelogEntries, trackedRepos } from '../db/schema/index.js'

type TrackedRepoRow = typeof trackedRepos.$inferSelect

interface GitHubRelease {
  id: number
  tag_name: string
  name: string | null
  body: string | null
  published_at: string
  html_url: string
  prerelease: boolean
  draft: boolean
}

async function fetchReleasesForRepo(
  owner: string,
  repo: string,
  since?: Date | null
): Promise<GitHubRelease[]> {
  const releases: GitHubRelease[] = []
  let page = 1
  const perPage = 100
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Oxy-Website-Changelog',
  }
  if (config.githubToken) {
    headers.Authorization = `Bearer ${config.githubToken}`
  }

  while (true) {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${perPage}&page=${page}`
    const res = await fetch(url, { headers })

    if (!res.ok) {
      if (res.status === 403) {
        const remaining = res.headers.get('X-RateLimit-Remaining')
        throw new Error(`GitHub rate limit hit (remaining: ${remaining})`)
      }
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
    }

    const data: GitHubRelease[] = await res.json()
    if (data.length === 0) break

    for (const release of data) {
      if (release.draft) continue
      if (since && new Date(release.published_at) <= since) {
        return releases // Stop if we've reached already-synced releases
      }
      releases.push(release)
    }

    if (data.length < perPage) break
    page++
  }

  return releases
}

/** One place to record the outcome of a sync attempt on the repo row. */
async function recordSync(repoId: string, error: string | null): Promise<void> {
  await db
    .update(trackedRepos)
    .set({ lastSyncAt: new Date(), lastSyncError: error, updatedAt: new Date() })
    .where(eq(trackedRepos._id, repoId))
}

async function syncRepo(trackedRepo: TrackedRepoRow): Promise<number> {
  const { owner, repo, displayName, defaultTags, lastSyncAt } = trackedRepo

  console.log(`[GitHub Sync] Syncing ${owner}/${repo}...`)

  try {
    const releases = await fetchReleasesForRepo(owner, repo, lastSyncAt)

    if (releases.length === 0) {
      console.log(`[GitHub Sync] ${owner}/${repo}: no new releases`)
      await recordSync(trackedRepo._id, null)
      return 0
    }

    const rows = releases.map((release) => {
      // Auto-detect tags from release
      const tags = [...((defaultTags as { label: string; color: string }[] | null) ?? [])]
      if (release.prerelease) {
        tags.push({ label: 'Pre-release', color: 'rgb(253, 144, 56)' })
      }

      return {
        title: release.name || release.tag_name,
        content: release.body || '',
        tags: tags.map((tag) => tag.label),
        date: new Date(release.published_at),
        githubReleaseId: release.id,
        repoOwner: owner,
        repoName: repo,
        repoDisplayName: displayName,
        htmlUrl: release.html_url,
        tagName: release.tag_name,
      }
    })

    // One statement for the whole page of releases, keyed on the release id —
    // the same upsert-per-release the bulkWrite did, minus the round trips.
    await db
      .insert(changelogEntries)
      .values(rows)
      .onConflictDoUpdate({
        target: changelogEntries.githubReleaseId,
        set: {
          title: sql`excluded.title`,
          content: sql`excluded.content`,
          tags: sql`excluded.tags`,
          date: sql`excluded.date`,
          repoOwner: sql`excluded.repo_owner`,
          repoName: sql`excluded.repo_name`,
          repoDisplayName: sql`excluded.repo_display_name`,
          htmlUrl: sql`excluded.html_url`,
          tagName: sql`excluded.tag_name`,
          updatedAt: new Date(),
        },
      })

    await recordSync(trackedRepo._id, null)

    console.log(`[GitHub Sync] ${owner}/${repo}: synced ${releases.length} releases`)
    return releases.length
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[GitHub Sync] ${owner}/${repo} error:`, message)
    await recordSync(trackedRepo._id, message)
    return 0
  }
}

export async function syncAllRepos(): Promise<void> {
  const repos = await db.select().from(trackedRepos).where(eq(trackedRepos.active, true))
  console.log(`[GitHub Sync] Syncing ${repos.length} repos...`)

  for (const repo of repos) {
    await syncRepo(repo)
  }

  console.log('[GitHub Sync] Sync complete')
}

export async function syncSingleRepo(repoId: string): Promise<number> {
  const [repo] = await db.select().from(trackedRepos).where(eq(trackedRepos._id, repoId)).limit(1)
  if (!repo) throw new Error('Repo not found')
  if (!repo.active) throw new Error('Repo is inactive')
  return syncRepo(repo)
}

export function startSyncInterval(intervalMs = 15 * 60 * 1000): void {
  // Run once after a short delay (let the database connection settle)
  setTimeout(() => {
    syncAllRepos().catch((err) => console.error('[GitHub Sync] Initial sync error:', err))
  }, 10_000)

  // Then run on interval
  const syncInterval = setInterval(() => {
    syncAllRepos().catch((err) => console.error('[GitHub Sync] Interval sync error:', err))
  }, intervalMs)
  // Background housekeeping must never hold the event loop open on its own.
  syncInterval.unref?.()

  console.log(`[GitHub Sync] Background sync started (every ${intervalMs / 60000} min)`)
}
