import { config } from '../config.js'
import TrackedRepo from '../models/TrackedRepo.js'
import { ChangelogEntry } from '../models/ChangelogEntry.js'

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

async function syncRepo(trackedRepo: any): Promise<number> {
  const { owner, repo, displayName, defaultTags, lastSyncAt } = trackedRepo

  console.log(`[GitHub Sync] Syncing ${owner}/${repo}...`)

  try {
    const releases = await fetchReleasesForRepo(owner, repo, lastSyncAt)

    if (releases.length === 0) {
      console.log(`[GitHub Sync] ${owner}/${repo}: no new releases`)
      trackedRepo.lastSyncAt = new Date()
      trackedRepo.lastSyncError = null
      await trackedRepo.save()
      return 0
    }

    const ops = releases.map((release) => {
      // Auto-detect tags from release
      const tags = [...(defaultTags || [])]
      if (release.prerelease) {
        tags.push({ label: 'Pre-release', color: 'rgb(253, 144, 56)' })
      }

      return {
        updateOne: {
          filter: { githubReleaseId: release.id },
          update: {
            $set: {
              title: release.name || release.tag_name,
              content: release.body || '',
              tags: tags.map((t: any) => t.label),
              date: new Date(release.published_at),
              githubReleaseId: release.id,
              repoOwner: owner,
              repoName: repo,
              repoDisplayName: displayName,
              htmlUrl: release.html_url,
              tagName: release.tag_name,
            },
          },
          upsert: true,
        },
      }
    })

    await ChangelogEntry.bulkWrite(ops)

    trackedRepo.lastSyncAt = new Date()
    trackedRepo.lastSyncError = null
    await trackedRepo.save()

    console.log(`[GitHub Sync] ${owner}/${repo}: synced ${releases.length} releases`)
    return releases.length
  } catch (err: any) {
    console.error(`[GitHub Sync] ${owner}/${repo} error:`, err.message)
    trackedRepo.lastSyncError = err.message
    await trackedRepo.save()
    return 0
  }
}

export async function syncAllRepos(): Promise<void> {
  const repos = await TrackedRepo.find({ active: true })
  console.log(`[GitHub Sync] Syncing ${repos.length} repos...`)

  for (const repo of repos) {
    await syncRepo(repo)
  }

  console.log('[GitHub Sync] Sync complete')
}

export async function syncSingleRepo(repoId: string): Promise<number> {
  const repo = await TrackedRepo.findById(repoId)
  if (!repo) throw new Error('Repo not found')
  if (!repo.active) throw new Error('Repo is inactive')
  return syncRepo(repo)
}

let syncInterval: NodeJS.Timeout | null = null

export function startSyncInterval(intervalMs = 15 * 60 * 1000): void {
  // Run once after a short delay (let MongoDB connect)
  setTimeout(() => {
    syncAllRepos().catch((err) => console.error('[GitHub Sync] Initial sync error:', err))
  }, 10_000)

  // Then run on interval
  syncInterval = setInterval(() => {
    syncAllRepos().catch((err) => console.error('[GitHub Sync] Interval sync error:', err))
  }, intervalMs)

  console.log(`[GitHub Sync] Background sync started (every ${intervalMs / 60000} min)`)
}

export function stopSyncInterval(): void {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}
