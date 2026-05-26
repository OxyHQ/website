/**
 * changelog-loader.ts — exposes the build-time GitHub-release index.
 *
 * The static JSON is produced by `scripts/sync-changelog.ts` during
 * `prebuild` and lives at `src/content/_changelog/index.json`. The public
 * `/changelog` page reads it directly instead of hitting the Express API
 * (which isn't deployed on Cloudflare Pages).
 */

import indexJson from './_changelog/index.json'

export interface StaticChangelogRepo {
  owner: string
  name: string
  displayName: string
}

export interface StaticChangelogEntry {
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

export interface StaticChangelogIndex {
  generatedAt: string
  repos: StaticChangelogRepo[]
  entries: StaticChangelogEntry[]
}

const data = indexJson as StaticChangelogIndex

export function getStaticChangelog(): StaticChangelogIndex {
  return data
}
