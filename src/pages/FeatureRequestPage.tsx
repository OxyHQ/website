import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@oxyhq/services'
import * as Skeleton from '@oxyhq/bloom/skeleton'
import { ArrowLeft, ChevronUp, ExternalLink } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import FeatureStatusBadge from '../components/features/FeatureStatusBadge'
import FeaturePriorityBadge from '../components/features/FeaturePriorityBadge'
import FeatureMarkdown from '../components/features/FeatureMarkdown'
import FeatureComments from '../components/features/FeatureComments'
import { useFeatureRequest, useToggleFeatureVote, type FeatureRequestData } from '../api/hooks'
import { errorStatus } from '../api/client'
import { featureRequestDescription, featureRequestPath } from '../lib/featureRequest'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <Navbar />
      <main className="container flex-1 pb-20 pt-10 lg:pb-28">{children}</main>
      <Footer />
    </div>
  )
}

function BackToBoard() {
  return (
    <Link
      to="/features"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Feature board
    </Link>
  )
}

export default function FeatureRequestPage() {
  const { owner = '', repo = '', number = '' } = useParams<{ owner: string; repo: string; number: string }>()
  const { data: feature, isPending, error } = useFeatureRequest(owner, repo, number)

  if (isPending) {
    return (
      <PageShell>
        <SEO
          title="Feature request"
          description="A proposal on the Oxy feature board."
          canonicalPath={featureRequestPath(owner, repo, number)}
          noIndex
        />
        <BackToBoard />
        <div className="mt-8 flex flex-col gap-4">
          <Skeleton.Box width="70%" height={32} borderRadius={6} />
          <Skeleton.Box width="40%" height={16} borderRadius={4} />
          <Skeleton.Box width="100%" height={120} borderRadius={8} />
        </div>
      </PageShell>
    )
  }

  // A request that is not on the board is genuinely gone: an unknown repo, an
  // unknown number, or an issue that never carried the feature-request label.
  // Anything else means the backend or GitHub is unwell, and telling someone
  // their link is dead when the truth is "try again in a minute" is worse than
  // saying nothing.
  if (!feature) {
    const missing = errorStatus(error) === 404
    return (
      <PageShell>
        <SEO
          title={missing ? 'Feature request not found' : 'Feature request unavailable'}
          description="A proposal on the Oxy feature board."
          canonicalPath={featureRequestPath(owner, repo, number)}
          noIndex
        />
        <BackToBoard />
        <div className="flex flex-col items-center py-24 text-center">
          <h1 className="text-heading-responsive-sm text-foreground">
            {missing ? 'This request is not on the board' : "This request couldn't be loaded"}
          </h1>
          <p className="mt-3 max-w-md text-pretty text-muted-foreground">
            {missing
              ? 'It may have been moved, or it belongs to a repository the board does not track.'
              : 'The board is having trouble reaching GitHub. Your link is fine, try again in a moment.'}
          </p>
          <Link
            to="/features"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse the feature board
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <SEO
        title={feature.title}
        description={featureRequestDescription(feature.description, feature.title)}
        canonicalPath={featureRequestPath(feature.owner, feature.repoName, feature.number)}
        ogType="article"
        publishedTime={feature.createdAt}
        modifiedTime={feature.updatedAt}
        author={feature.author}
      />

      <BackToBoard />

      <article className="mt-6 max-w-3xl">
        <header className="flex gap-5">
          <VoteControl feature={feature} />

          <div className="min-w-0 flex-1">
            <h1 className="text-balance text-heading-responsive-sm text-foreground">{feature.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <FeatureStatusBadge status={feature.status} />
              <FeaturePriorityBadge priority={feature.priority} />
              <Link
                to={`/features?app=${encodeURIComponent(feature.app.key)}`}
                className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {feature.app.displayName}
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <img
                  src={feature.authorAvatar}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-4 w-4 rounded-full"
                />
                {feature.author}
              </span>
              <span>opened {formatDate(feature.createdAt)}</span>
              <span className="font-mono">
                {feature.owner}/{feature.repoName}#{feature.number}
              </span>
              <a
                href={feature.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                View on GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </header>

        <div className="mt-8">
          {feature.description
            ? <FeatureMarkdown content={feature.description} />
            : <p className="text-sm text-muted-foreground">This request was opened without a description.</p>}
        </div>

        <FeatureComments
          owner={feature.owner}
          repo={feature.repoName}
          number={String(feature.number)}
          commentCount={feature.commentCount}
          threadUrl={feature.htmlUrl}
        />
      </article>
    </PageShell>
  )
}

/**
 * The vote control, sharing `useToggleFeatureVote` with the board's cards so
 * both surfaces apply the same optimistic update and the same rollback.
 */
function VoteControl({ feature }: { feature: FeatureRequestData }) {
  const { isAuthenticated, signIn } = useAuth()
  const toggleVote = useToggleFeatureVote(feature.owner, feature.repoName, feature.number)

  function handleVote() {
    if (!isAuthenticated) {
      signIn()
      return
    }
    toggleVote.mutate()
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        onClick={handleVote}
        className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border transition-colors ${
          feature.userVoted
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
        }`}
        aria-label={feature.userVoted ? 'Remove vote' : 'Upvote'}
        aria-pressed={feature.userVoted}
      >
        <ChevronUp className="h-6 w-6" />
      </button>
      <span className={`text-base font-semibold ${feature.userVoted ? 'text-primary' : 'text-muted-foreground'}`}>
        {feature.totalVotes}
      </span>
      <span className="text-body-xs text-muted-foreground">
        {feature.totalVotes === 1 ? 'vote' : 'votes'}
      </span>
    </div>
  )
}
