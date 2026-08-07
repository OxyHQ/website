/**
 * Put the real Oxy and FairCoin repos on the feature board.
 *
 * Non-destructive, and safe to re-run against production. It turns the two
 * feature board switches on and leaves everything else alone: an existing row's
 * `displayName`, its `defaultTags` and its `active` changelog sync switch are
 * only ever written when the row is created, so re-running never renames an app
 * an admin renamed, and never starts syncing releases from a repo nobody asked
 * to sync. A new row is created with changelog sync OFF for exactly that
 * reason: this script is about the board, and enrolling 20-odd repos into the
 * changelog as a side effect is not what anyone running it is asking for.
 *
 * `server/seed.ts` is deliberately not the place for this: that one wipes
 * every table before it writes.
 *
 * Usage: DATABASE_URL=... bun server/seedFeatureBoardRepos.ts
 */
import { and, eq } from 'drizzle-orm'
import { config } from './config.js'
import { closeDatabase, db } from './db/postgres.js'
import { trackedRepos } from './db/schema/index.js'
import { GitHubApiError, githubRequest } from './services/featureBoard.js'
import { toErrorMessage } from './utils/errorMessage.js'

interface SeedRepo {
  owner: string
  repo: string
  displayName: string
}

/**
 * The board spans two GitHub orgs, which is the point of driving the allow-list
 * from this collection: Oxy develops FairCoin, and a repo in a second org is a
 * row here rather than a change to a hardcoded org name.
 */
const REPOS: SeedRepo[] = [
  { owner: 'OxyHQ', repo: 'oxy', displayName: 'Oxy platform' },
  { owner: 'OxyHQ', repo: 'Mention', displayName: 'Mention' },
  { owner: 'OxyHQ', repo: 'Allo', displayName: 'Allo' },
  { owner: 'OxyHQ', repo: 'Alia', displayName: 'Alia' },
  { owner: 'OxyHQ', repo: 'Homiio', displayName: 'Homiio' },
  { owner: 'OxyHQ', repo: 'Mercaria', displayName: 'Mercaria' },
  { owner: 'OxyHQ', repo: 'OxyPay', displayName: 'Oxy Pay' },
  { owner: 'OxyHQ', repo: 'Moovo', displayName: 'Moovo' },
  { owner: 'OxyHQ', repo: 'Syra', displayName: 'Syra' },
  { owner: 'OxyHQ', repo: 'Space', displayName: 'Space' },
  { owner: 'OxyHQ', repo: 'Astro', displayName: 'Astro' },
  { owner: 'OxyHQ', repo: 'Schedio', displayName: 'Schedio' },
  { owner: 'OxyHQ', repo: 'Clarity', displayName: 'Clarity' },
  { owner: 'OxyHQ', repo: 'CrowdSource', displayName: 'CrowdSource' },
  { owner: 'OxyHQ', repo: 'Authenticator', displayName: 'Oxy Authenticator' },
  { owner: 'OxyHQ', repo: 'tnp', displayName: 'TNP' },
  { owner: 'OxyHQ', repo: 'Bloom', displayName: 'Bloom' },
  { owner: 'OxyHQ', repo: 'website', displayName: 'Oxy website' },
  { owner: 'FairCoinOfficial', repo: 'FairCoin', displayName: 'FairCoin' },
  { owner: 'FairCoinOfficial', repo: 'FAIRWallet', displayName: 'FAIR Wallet' },
  { owner: 'FairCoinOfficial', repo: 'Explorer', displayName: 'FairCoin Explorer' },
  { owner: 'FairCoinOfficial', repo: 'FAIRNode', displayName: 'FAIR Node' },
  { owner: 'FairCoinOfficial', repo: 'faircoin-bridge', displayName: 'FairCoin Bridge' },
]

interface RepoState {
  archived: boolean
  has_issues: boolean
  private: boolean
}

/**
 * Confirm a repo can actually carry the board before enrolling it.
 *
 * A typo, a rename or a repo with issues switched off would otherwise sit in
 * the collection contributing an unmatchable qualifier to every search. Skipped
 * without a token, since the check is worth having but not worth blocking on.
 */
async function checkRepo(entry: SeedRepo): Promise<string | null> {
  try {
    const state = await githubRequest<RepoState>(`/repos/${entry.owner}/${entry.repo}`)
    if (state.private) return 'repo is private, its issues cannot be shown publicly'
    if (state.archived) return 'repo is archived'
    if (!state.has_issues) return 'repo has issues disabled'
    return null
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 404) return 'repo not found'
    return `could not be checked: ${toErrorMessage(err)}`
  }
}

async function main(): Promise<void> {

  const canCheck = Boolean(config.featureBoard.githubToken || config.githubToken)
  if (!canCheck) {
    console.warn('No GitHub token set, seeding without verifying the repos exist')
  }

  let created = 0
  let updated = 0
  let skipped = 0

  for (const entry of REPOS) {
    if (canCheck) {
      const problem = await checkRepo(entry)
      if (problem) {
        console.warn(`skip ${entry.owner}/${entry.repo}: ${problem}`)
        skipped++
        continue
      }
    }

    // The two board switches are the only fields an existing row gets: a
    // display name an admin changed, and the changelog `active` switch, are
    // written on insert and never touched again.
    const [existing] = await db
      .select({ id: trackedRepos._id })
      .from(trackedRepos)
      .where(and(eq(trackedRepos.owner, entry.owner), eq(trackedRepos.repo, entry.repo)))
      .limit(1)

    if (existing) {
      await db
        .update(trackedRepos)
        .set({ featureBoard: true, acceptsProposals: true, updatedAt: new Date() })
        .where(eq(trackedRepos._id, existing.id))
    } else {
      await db.insert(trackedRepos).values({
        owner: entry.owner,
        repo: entry.repo,
        displayName: entry.displayName,
        defaultTags: [],
        active: false,
        featureBoard: true,
        acceptsProposals: true,
      })
    }

    if (!existing) {
      created++
      console.log(`added   ${entry.owner}/${entry.repo} as "${entry.displayName}"`)
    } else {
      updated++
      console.log(`on board ${entry.owner}/${entry.repo}`)
    }
  }

  console.log(`\nFeature board: ${created} added, ${updated} already tracked, ${skipped} skipped`)
  await closeDatabase()
}

main().catch((err) => {
  console.error('Seed failed:', toErrorMessage(err))
  process.exit(1)
})
