import { config } from '../config.js'
import { getPriorityTiers, type PriorityTier } from '../constants/featurePriority.js'
import {
  githubRequest,
  listFeatureRepos,
  loadFeatureRequests,
  type FeatureRepo,
  type GitHubLabel,
} from './featureBoard.js'
import { toErrorMessage } from '../utils/errorMessage.js'

/** Wait this long after boot before the first reconcile, so MongoDB is up. */
const INITIAL_DELAY_MS = 30_000

/**
 * Which tier an issue should carry, given its combined vote count and the tier
 * it carries today.
 *
 * Climbing is immediate: reaching `enterAt` earns the tier. Falling is not: a
 * tier is only given up once the count drops below that tier's `exitAt`, and
 * the issue then lands on whichever tier its raw count actually justifies. That
 * asymmetry is the whole point. Without it an issue parked on a boundary
 * relabels itself on every single vote in either direction, and a maintainer
 * opening it finds a timeline of nothing but label churn.
 */
export function decideTier(
  totalVotes: number,
  currentKey: string | null,
  tiers: PriorityTier[],
): PriorityTier | null {
  let targetIndex = -1
  for (let index = 0; index < tiers.length; index++) {
    if (tiers[index].enterAt <= totalVotes) targetIndex = index
  }

  const currentIndex = currentKey ? tiers.findIndex((tier) => tier.key === currentKey) : -1
  if (currentIndex === -1) {
    return targetIndex === -1 ? null : tiers[targetIndex]
  }

  const current = tiers[currentIndex]
  if (targetIndex > currentIndex) return tiers[targetIndex]
  if (totalVotes >= current.exitAt) return current
  return targetIndex === -1 ? null : tiers[targetIndex]
}

/** The tier whose label appears in `labels`, or null. */
function tierFromLabels(labels: GitHubLabel[], tiers: PriorityTier[]): PriorityTier | null {
  const names = new Set(labels.map((label) => label.name.toLowerCase()))
  return tiers.find((tier) => names.has(tier.label.toLowerCase())) ?? null
}

/**
 * Create any missing priority label in a repo, with the same name, colour and
 * description everywhere, in every org.
 *
 * An existing label is left exactly as it is. Repainting one on every run would
 * fight a maintainer who recoloured it, and the colour is not what the board
 * depends on.
 */
async function ensurePriorityLabels(repo: FeatureRepo, tiers: PriorityTier[]): Promise<void> {
  const existing = await githubRequest<GitHubLabel[]>(
    `/repos/${repo.owner}/${repo.repo}/labels?per_page=100`,
  )
  const names = new Set(existing.map((label) => label.name.toLowerCase()))

  for (const tier of tiers) {
    if (names.has(tier.label.toLowerCase())) continue
    await githubRequest(`/repos/${repo.owner}/${repo.repo}/labels`, {
      method: 'POST',
      write: true,
      body: { name: tier.label, color: tier.color, description: tier.description },
    })
    console.log(`[feature-priority] created label "${tier.label}" in ${repo.key}`)
  }
}

export interface PriorityChange {
  repo: string
  issueNumber: number
  totalVotes: number
  from: string | null
  to: string | null
}

export interface ReconcileReport {
  dryRun: boolean
  /** Open feature requests considered. */
  checked: number
  /** Issues whose label was already correct, so nothing was written. */
  unchanged: number
  changes: PriorityChange[]
  errors: Array<{ scope: string; message: string }>
}

/**
 * Bring every open feature request's priority label in line with its vote
 * count.
 *
 * Runs on a schedule rather than on each vote, deliberately. A vote is cheap
 * and frequent; a label write is a permanent line in the issue's timeline. One
 * pass an hour that writes only genuine crossings keeps the issue readable,
 * where a write per vote would bury the conversation under its own bookkeeping.
 *
 * `totalVotes` is the number that drives it, the same figure the board sorts
 * by, so the label a maintainer sees on GitHub always agrees with the order
 * visitors see on the site. Site votes alone would ignore everyone who upvoted
 * on GitHub, and reactions alone would ignore everyone who upvoted here.
 */
export async function reconcileFeaturePriorities(): Promise<ReconcileReport> {
  const tiers = getPriorityTiers()
  const dryRun = config.featureBoard.priorityDryRun
  const report: ReconcileReport = { dryRun, checked: 0, unchanged: 0, changes: [], errors: [] }

  const repos = await listFeatureRepos()
  const reposByKey = new Map(repos.map((repo) => [repo.key, repo]))
  const labelsEnsured = new Set<string>()

  // Closed issues are left alone: their label is history, and relabelling a
  // shipped or declined request only churns a timeline nobody is reading for
  // priority any more.
  const requests = (await loadFeatureRequests()).filter((request) => request.state === 'open')

  for (const request of requests) {
    report.checked++
    const repo = reposByKey.get(request.app.key)
    if (!repo) continue

    // Fast path, and the reason a steady state costs nothing: the cached board
    // data already says the label matches, so no GitHub call is made at all.
    const cachedTier = tierFromLabels(request.labels, tiers)
    const wantedFromCache = decideTier(request.totalVotes, cachedTier?.key ?? null, tiers)
    if ((wantedFromCache?.key ?? null) === (cachedTier?.key ?? null)) {
      report.unchanged++
      continue
    }

    try {
      // The cached view can be up to five minutes old, and the write below
      // replaces the whole label set. Re-read first so a label a maintainer
      // added in the meantime is carried over rather than erased, and so a
      // change another instance already made is detected as "nothing to do".
      const currentLabels = await githubRequest<GitHubLabel[]>(
        `/repos/${repo.owner}/${repo.repo}/issues/${request.number}/labels?per_page=100`,
      )
      const currentTier = tierFromLabels(currentLabels, tiers)
      const wanted = decideTier(request.totalVotes, currentTier?.key ?? null, tiers)

      if ((wanted?.key ?? null) === (currentTier?.key ?? null)) {
        report.unchanged++
        continue
      }

      report.changes.push({
        repo: repo.key,
        issueNumber: request.number,
        totalVotes: request.totalVotes,
        from: currentTier?.key ?? null,
        to: wanted?.key ?? null,
      })

      if (dryRun) continue

      if (!labelsEnsured.has(repo.key)) {
        await ensurePriorityLabels(repo, tiers)
        labelsEnsured.add(repo.key)
      }

      // Note: a tier removed from the table stops being managed here, so its
      // label survives on any issue still carrying it and has to be deleted by
      // hand. Stripping every `priority:` label instead would trample labels
      // the repo manages itself.
      const managed = new Set(tiers.map((tier) => tier.label.toLowerCase()))
      const nextLabels = currentLabels
        .map((label) => label.name)
        .filter((name) => !managed.has(name.toLowerCase()))
      if (wanted) nextLabels.push(wanted.label)

      await githubRequest(`/repos/${repo.owner}/${repo.repo}/issues/${request.number}/labels`, {
        method: 'PUT',
        write: true,
        body: { labels: nextLabels },
      })
      console.log(
        `[feature-priority] ${repo.key}#${request.number}: ${currentTier?.key ?? 'none'} -> ${wanted?.key ?? 'none'} (${request.totalVotes} votes)`,
      )
    } catch (err) {
      const scope = `${repo.key}#${request.number}`
      const message = toErrorMessage(err)
      report.errors.push({ scope, message })
      console.error(`[feature-priority] ${scope} failed:`, message)
    }
  }

  return report
}

/**
 * Start the background reconcile.
 *
 * Does nothing without a write token, rather than failing once an hour forever:
 * an install that has not provisioned `FEATURE_BOARD_GITHUB_TOKEN` still serves
 * the board and still counts votes, it just does not write labels. Dry run is
 * the exception, since it never writes anyway.
 */
export function startFeaturePriorityInterval(): void {
  if (!config.featureBoard.githubToken && !config.featureBoard.priorityDryRun) {
    console.warn('[feature-priority] disabled: FEATURE_BOARD_GITHUB_TOKEN is not set')
    return
  }

  const run = () => {
    reconcileFeaturePriorities()
      .then((report) => {
        if (report.changes.length > 0 || report.errors.length > 0) {
          console.log(
            `[feature-priority] reconciled ${report.checked} issues: ${report.changes.length} changed, ${report.errors.length} failed${report.dryRun ? ' (dry run)' : ''}`,
          )
        }
      })
      .catch((err) => console.error('[feature-priority] reconcile failed:', toErrorMessage(err)))
  }

  const initial = setTimeout(run, INITIAL_DELAY_MS)
  initial.unref?.()

  const interval = setInterval(run, config.featureBoard.priorityReconcileMinutes * 60 * 1000)
  // Background housekeeping must never hold the event loop open on its own.
  interval.unref?.()

  console.log(
    `[feature-priority] background reconcile started (every ${config.featureBoard.priorityReconcileMinutes} min${config.featureBoard.priorityDryRun ? ', dry run' : ''})`,
  )
}
