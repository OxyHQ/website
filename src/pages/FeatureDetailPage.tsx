import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@oxyhq/auth'
import { ArrowLeft, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import FeatureStatusBadge from '../components/features/FeatureStatusBadge'
import CommentSection from '../components/social/CommentSection'
import { useFeatureRequest, useToggleFeatureVote, useUpdateFeatureStatus } from '../api/hooks'

const ADMIN_STATUSES = ['open', 'under_review', 'planned', 'in_progress', 'completed', 'declined'] as const

export default function FeatureDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { isAuthenticated, signIn, user } = useAuth()

  const { data: feature, isPending, isError } = useFeatureRequest(slug)
  const toggleVote = useToggleFeatureVote(slug)
  const updateStatus = useUpdateFeatureStatus(slug)

  const [adminStatus, setAdminStatus] = useState('')
  const [adminNote, setAdminNote] = useState('')

  const isAdmin = user?.role === 'admin'

  function handleVote() {
    if (!isAuthenticated) {
      signIn()
      return
    }
    toggleVote.mutate()
  }

  function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!adminStatus) return
    updateStatus.mutate(
      { status: adminStatus, adminNote: adminNote.trim() || undefined },
      {
        onSuccess: () => {
          setAdminStatus('')
          setAdminNote('')
        },
      },
    )
  }

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title={feature?.title ?? 'Feature Request'}
        description={feature?.description?.slice(0, 160) ?? 'View and vote on this feature request.'}
        canonicalPath={`/features/${slug}`}
      />
      <Navbar />

      <main className="container pb-20 pt-8 lg:pb-28">
        <Link
          to="/features"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feature Board
        </Link>

        {isPending && (
          <div className="space-y-4 py-16">
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-surface" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-surface" />
            <div className="mt-6 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-surface" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-surface" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
            </div>
          </div>
        )}

        {isError && !isPending && (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">Feature request not found.</p>
            <Link to="/features" className="mt-2 inline-block text-sm text-primary hover:underline">
              Return to board
            </Link>
          </div>
        )}

        {feature && (
          <article className="mx-auto max-w-3xl">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground lg:text-3xl">{feature.title}</h1>
                  <FeatureStatusBadge status={feature.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium">
                    {feature.category}
                  </span>
                  <span>by {feature.username}</span>
                  <span>{new Date(feature.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Vote button */}
              <button
                onClick={handleVote}
                disabled={toggleVote.isPending}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  feature.userVoted
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                }`}
              >
                <ChevronUp className="h-5 w-5" />
                <span>{feature.voteCount}</span>
                <span>{feature.userVoted ? 'Voted' : 'Vote'}</span>
              </button>
            </div>

            {/* Description */}
            {feature.description && (
              <div className="mt-8 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-blue-500 prose-code:text-foreground prose-code:bg-surface prose-code:rounded-md prose-code:px-1 prose-li:marker:text-muted-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {feature.description}
                </ReactMarkdown>
              </div>
            )}

            {/* Admin note */}
            {feature.adminNote && (
              <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-400">Admin Note</p>
                <p className="text-sm text-foreground">{feature.adminNote}</p>
              </div>
            )}

            {/* Admin controls */}
            {isAdmin && (
              <form onSubmit={handleStatusUpdate} className="mt-8 rounded-lg border border-border bg-surface/50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Admin Controls</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <label htmlFor="admin-status" className="mb-1 block text-xs font-medium text-muted-foreground">
                      Change Status
                    </label>
                    <select
                      id="admin-status"
                      value={adminStatus}
                      onChange={(e) => setAdminStatus(e.target.value)}
                      className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                    >
                      <option value="">Select status...</option>
                      {ADMIN_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="admin-note" className="mb-1 block text-xs font-medium text-muted-foreground">
                      Admin Note (optional)
                    </label>
                    <textarea
                      id="admin-note"
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add an internal or public note..."
                      className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
                    />
                  </div>
                  {updateStatus.isError && (
                    <p className="text-sm text-red-400">
                      {updateStatus.error instanceof Error ? updateStatus.error.message : 'Failed to update status.'}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!adminStatus || updateStatus.isPending}
                    className="self-start rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updateStatus.isPending ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </form>
            )}

            {/* Comments */}
            <div className="mt-10 border-t border-border pt-8">
              <h2 className="mb-6 text-lg font-semibold text-foreground">Comments</h2>
              <CommentSection targetType="feature_request" targetId={feature._id} />
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  )
}
