import { ChevronUp, MessageSquare, ExternalLink } from 'lucide-react'
import FeatureStatusBadge from './FeatureStatusBadge'
import type { FeatureRequestData } from '../../api/hooks'

interface FeatureCardProps {
  feature: FeatureRequestData
  onVote: () => void
}

export default function FeatureCard({ feature, onVote }: FeatureCardProps) {
  const descriptionPreview =
    feature.description.length > 120
      ? feature.description.slice(0, 120) + '...'
      : feature.description

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-background p-4 transition-colors hover:border-muted-foreground/30">
      {/* Vote column */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onVote}
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition-colors ${
            feature.userVoted
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
          }`}
          aria-label={feature.userVoted ? 'Remove vote' : 'Upvote'}
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <span className={`text-sm font-semibold ${feature.userVoted ? 'text-primary' : 'text-muted-foreground'}`}>
          {feature.totalVotes}
        </span>
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={feature.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline"
          >
            {feature.title}
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
          <FeatureStatusBadge status={feature.status} />
        </div>

        {descriptionPreview && (
          <p className="mt-1 text-sm text-muted-foreground">{descriptionPreview}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-2 py-0.5 font-medium">
            {feature.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {feature.commentCount}
          </span>
          <span className="rounded-full bg-surface px-2 py-0.5">
            {feature.repoName}
          </span>
          <span>
            <img src={feature.authorAvatar} alt="" className="mr-1 inline h-4 w-4 rounded-full" />
            {feature.author}
          </span>
          <span>{new Date(feature.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  )
}
