import { ExternalLink } from 'lucide-react'
import FeatureMarkdown from './FeatureMarkdown'
import { useFeatureComments } from '../../api/hooks'

interface FeatureCommentsProps {
  owner: string
  repo: string
  number: string
  /** Comment count from the issue, used to skip the request when there are none. */
  commentCount: number
  /** The issue on GitHub, where replying happens. */
  threadUrl: string
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * The issue thread, read only.
 *
 * Replying goes to GitHub. Accepting comments from this form would put an
 * unbounded public write on a thread real people are subscribed to, which is a
 * different problem from accepting a proposal and needs its own answer.
 */
export default function FeatureComments({ owner, repo, number, commentCount, threadUrl }: FeatureCommentsProps) {
  const { data, isPending, isError } = useFeatureComments(owner, repo, number, { enabled: commentCount > 0 })

  const comments = data?.comments ?? []

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          {commentCount === 1 ? '1 comment' : `${commentCount} comments`}
        </h2>
        <a
          href={threadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Reply on GitHub
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {commentCount === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          No comments yet. Start the discussion on GitHub.
        </p>
      )}

      {commentCount > 0 && isPending && (
        <p className="mt-4 text-sm text-muted-foreground">Loading the discussion...</p>
      )}

      {isError && (
        <p className="mt-4 text-sm text-muted-foreground">
          The discussion could not be loaded. It is all on GitHub.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {comments.map((comment) => (
          <article key={comment.id} className="flex gap-3">
            <a href={comment.authorUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img
                src={comment.authorAvatar}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-8 w-8 rounded-full border border-border"
              />
            </a>
            <div className="min-w-0 flex-1 rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <a
                  href={comment.authorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:underline"
                >
                  {comment.author}
                </a>
                {comment.fromMaintainer && (
                  <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                    Maintainer
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
              </div>
              <div className="mt-2">
                <FeatureMarkdown content={comment.body} />
              </div>
            </div>
          </article>
        ))}
      </div>

      {data?.hasMore && (
        <a
          href={threadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          This thread is longer than what is shown here. Read the rest on GitHub
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </section>
  )
}
