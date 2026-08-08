import { Link } from 'react-router-dom'
import { ChevronUp, MessageSquare, ExternalLink } from 'lucide-react'
import FeatureStatusBadge from './FeatureStatusBadge'
import FeaturePriorityBadge from './FeaturePriorityBadge'
import type { FeatureRequestData } from '../../api/hooks'
import { featureRequestDescription, featureRequestPath } from '../../lib/featureRequest'

interface FeatureCardProps {
  feature: FeatureRequestData
  onVote: () => void
  /** Hide the app chip where the surrounding context already names the app. */
  hideApp?: boolean
}

/**
 * One proposal, as a feed row.
 *
 * Mention's feed is a continuous column of rows divided by a hairline, not a
 * stack of floating bricks (`components/Feed/feedRows.tsx`), and the rounded
 * bordered card is reserved for content nested INSIDE a row. Copying that
 * grammar is most of what makes this read as the same product: the separator
 * belongs to the list, the card belongs to a quotation.
 */
export default function FeatureCard({ feature, onVote, hideApp = false }: FeatureCardProps) {
  const detailPath = featureRequestPath(feature.owner, feature.repoName, feature.number)
  // The same stripping the meta description uses. A raw slice of the body opens
  // most of these rows with "## Description", which is markup, not a summary.
  const descriptionPreview = feature.description
    ? featureRequestDescription(feature.description, '')
    : ''

  return (
    <article className="flex gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-surface/40">
      {/* Vote column */}
      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <button
          onClick={onVote}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition-colors ${
            feature.userVoted
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
          }`}
          aria-label={feature.userVoted ? 'Remove vote' : 'Upvote'}
          aria-pressed={feature.userVoted}
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <span className={`text-body-sm font-semibold ${feature.userVoted ? 'text-primary' : 'text-muted-foreground'}`}>
          {feature.totalVotes}
        </span>
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* The title opens the request here, not on GitHub. Reading a proposal
              and voting on it are both things this site does; the GitHub thread
              is where you go to join the discussion, which is why it stays a
              quiet secondary link below rather than the primary action. */}
          <Link to={detailPath} className="font-semibold text-foreground hover:underline">
            {feature.title}
          </Link>
          <FeatureStatusBadge status={feature.status} />
          <FeaturePriorityBadge priority={feature.priority} />
        </div>

        {descriptionPreview && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{descriptionPreview}</p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {!hideApp && (
            <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 font-medium">
              {feature.app.displayName}
            </span>
          )}
          <Link to={detailPath} className="inline-flex items-center gap-1 transition-colors hover:text-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            {feature.commentCount}
          </Link>
          <span className="inline-flex items-center gap-1">
            <img src={feature.authorAvatar} alt="" loading="lazy" className="h-4 w-4 rounded-full" />
            {feature.author}
          </span>
          <span>{new Date(feature.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <a
            href={feature.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  )
}
