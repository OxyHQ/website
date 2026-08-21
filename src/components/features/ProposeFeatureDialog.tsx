import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dialog } from '@oxyhq/bloom/dialog'
import { useAuth } from '@oxyhq/services'
import { ChevronUp, ExternalLink } from 'lucide-react'
import Button from '../ui/Button'
import FeatureStatusBadge from './FeatureStatusBadge'
import { featureRequestPath } from '../../lib/featureRequest'
import {
  useProposeFeature,
  useSimilarFeatures,
  useToggleFeatureVote,
  type FeatureAppOption,
  type FeatureAppsResponse,
  type FeatureRequestData,
} from '../../api/hooks'

/** How long typing settles before the duplicate lookup runs, in ms. */
const SIMILAR_DEBOUNCE_MS = 300

interface ProposeFeatureDialogProps {
  open: boolean
  onClose: () => void
  apps: FeatureAppOption[]
  limits: FeatureAppsResponse['limits']
}

const fieldClasses =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-muted-foreground'

/**
 * The proposal form.
 *
 * Submitting opens a real GitHub issue in the selected app's repository, so the
 * confirmation links straight to it: the board itself only picks the issue up
 * once GitHub's search index has it, which is not instant, and claiming
 * otherwise would look like the proposal had been lost.
 */
export default function ProposeFeatureDialog({ open, onClose, apps, limits }: ProposeFeatureDialogProps) {
  const targets = apps.filter((option) => option.acceptsProposals)
  const [chosenApp, setChosenApp] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [settledTitle, setSettledTitle] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const similarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const propose = useProposeFeature()

  // Runs against the same in-memory set the board searches, so looking for a
  // duplicate while someone types costs no GitHub request.
  const similar = useSimilarFeatures(settledTitle, { enabled: open })
  const matches = similar.data?.matches ?? []

  // Derived rather than seeded into state: the apps arrive from a query, so
  // state initialised on the first render would keep an empty selection forever
  // when the dialog mounts before the list resolves.
  const app = chosenApp || targets[0]?.key || ''

  const trimmedTitle = title.trim()
  const trimmedBody = body.trim()
  // A speed bump, not a barrier. Token overlap produces false positives freely,
  // and a hard block on one of those means the proposal never gets written at
  // all. So matches never disable the button; they only ask for one click that
  // says you looked.
  const needsAcknowledgement = matches.length > 0 && !acknowledged
  const canSubmit =
    app !== '' &&
    trimmedTitle.length >= limits.titleMin &&
    trimmedTitle.length <= limits.titleMax &&
    trimmedBody.length >= limits.bodyMin &&
    trimmedBody.length <= limits.bodyMax &&
    !needsAcknowledgement &&
    !propose.isPending

  function handleTitleChange(next: string) {
    setTitle(next)
    setAcknowledged(false)
    if (similarTimer.current) clearTimeout(similarTimer.current)
    similarTimer.current = setTimeout(() => setSettledTitle(next), SIMILAR_DEBOUNCE_MS)
  }

  function handleClose() {
    if (similarTimer.current) clearTimeout(similarTimer.current)
    setTitle('')
    setBody('')
    setSettledTitle('')
    setAcknowledged(false)
    propose.reset()
    onClose()
  }

  function handleSubmit() {
    if (!canSubmit) return
    propose.mutate({ app, title: trimmedTitle, body: trimmedBody })
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={560}>
      <div className="w-full p-5 text-start">
        {propose.isSuccess ? (
          <div>
            <h2 className="text-start text-subheading-2">Proposal submitted</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              It is now issue #{propose.data.issueNumber} in {propose.data.app.displayName}. It joins the
              board once GitHub has indexed it, usually within a minute.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={propose.data.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
              >
                View it on GitHub
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Button variant="outline" size="sm" onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-start text-subheading-2">Propose a feature</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This opens an issue on GitHub under your Oxy handle, where everyone can vote on it.
            </p>

            {targets.length === 0 ? (
              <p className="mt-5 text-sm text-muted-foreground">
                No app is accepting proposals from the website right now.
              </p>
            ) : (
              <div className="mt-5 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">App</span>
                  <select
                    value={app}
                    onChange={(event) => setChosenApp(event.target.value)}
                    className={fieldClasses}
                  >
                    {targets.map((option) => (
                      <option key={option.key} value={option.key}>{option.displayName}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between text-sm font-medium text-foreground">
                    Title
                    <span className="text-xs font-normal text-muted-foreground">
                      {trimmedTitle.length}/{limits.titleMax}
                    </span>
                  </span>
                  <input
                    value={title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    maxLength={limits.titleMax}
                    placeholder="What should we build?"
                    className={fieldClasses}
                  />
                </label>

                <SimilarPanel
                  matches={matches}
                  searched={similar.data?.searched ?? false}
                  isFetching={similar.isFetching}
                  hasTitle={settledTitle.trim().length >= 3}
                  acknowledged={acknowledged}
                  onAcknowledge={() => setAcknowledged(true)}
                />

                <label className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between text-sm font-medium text-foreground">
                    Description
                    <span className="text-xs font-normal text-muted-foreground">
                      {trimmedBody.length}/{limits.bodyMax}
                    </span>
                  </span>
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={limits.bodyMax}
                    rows={7}
                    placeholder="What problem does it solve, and who has it? Markdown works."
                    className={`${fieldClasses} resize-y`}
                  />
                </label>

                {propose.isError && (
                  <p className="text-sm text-error-text">{propose.error.message}</p>
                )}

                <div className="flex items-center justify-end gap-3">
                  <Button variant="ghost" size="md" onClick={handleClose}>Cancel</Button>
                  <Button variant="primary" size="md" onClick={handleSubmit} disabled={!canSubmit}>
                    {propose.isPending ? 'Submitting…' : 'Submit proposal'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  )
}

/**
 * What the board already has that looks like what is being typed.
 *
 * Shown before the description, because that is the point at which someone has
 * said enough to be matched and has not yet spent effort writing the rest. The
 * best outcome here is not a blocked submission: it is a vote on the proposal
 * that already exists, which counts for more than a sixth copy of it.
 */
function SimilarPanel({ matches, searched, isFetching, hasTitle, acknowledged, onAcknowledge }: {
  matches: FeatureRequestData[]
  searched: boolean
  isFetching: boolean
  hasTitle: boolean
  acknowledged: boolean
  onAcknowledge: () => void
}) {
  if (!hasTitle) return null

  if (matches.length === 0) {
    if (isFetching) {
      return <p className="text-xs text-muted-foreground">Checking for existing proposals...</p>
    }
    // Deliberately not "nothing like this exists". The lookup matches on words,
    // over a list that can be a few minutes old, so the honest claim is about
    // what was found, not about what is out there.
    return (
      <p className="text-xs text-muted-foreground">
        {searched
          ? 'No existing proposal matched those words. Worth a look at the board too, since this matches on wording.'
          : 'Could not check for existing proposals just now.'}
      </p>
    )
  }

  return (
    <section className="rounded-2xl border border-border px-3 py-3">
      <h3 className="text-sm font-medium text-foreground">
        {matches.length === 1 ? 'One proposal looks similar' : `${matches.length} proposals look similar`}
      </h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Voting on one that already exists carries further than a new copy. The same idea for a
        different app is its own proposal, so check which app each is for.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {matches.map((match) => (
          <SimilarMatch key={match.id} match={match} />
        ))}
      </div>

      {!acknowledged && (
        <button
          onClick={onAcknowledge}
          className="mt-3 cursor-pointer text-xs font-medium text-foreground underline underline-offset-2 transition-opacity hover:opacity-70"
        >
          None of these is what I mean, continue
        </button>
      )}
    </section>
  )
}

/** One match, votable without leaving the form. */
function SimilarMatch({ match }: { match: FeatureRequestData }) {
  const { isAuthenticated, signIn } = useAuth()
  const toggleVote = useToggleFeatureVote(match.owner, match.repoName, match.number)

  function handleVote() {
    if (!isAuthenticated) {
      signIn()
      return
    }
    toggleVote.mutate()
  }

  return (
    <div className="flex items-start gap-2.5">
      <button
        onClick={handleVote}
        aria-label={match.userVoted ? `Remove vote from ${match.title}` : `Vote for ${match.title}`}
        aria-pressed={match.userVoted}
        className={`flex shrink-0 flex-col items-center rounded-lg border px-2 py-1 transition-colors ${
          match.userVoted
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
        }`}
      >
        <ChevronUp className="h-4 w-4" />
        <span className="text-body-xs font-semibold">{match.totalVotes}</span>
      </button>

      <div className="min-w-0 flex-1">
        <Link
          to={featureRequestPath(match.owner, match.repoName, match.number)}
          className="block truncate text-sm font-medium text-foreground hover:underline"
        >
          {match.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-medium">
            {match.app.displayName}
          </span>
          <FeatureStatusBadge status={match.status} />
          {match.state === 'closed' && <span>closed</span>}
        </div>
      </div>
    </div>
  )
}
