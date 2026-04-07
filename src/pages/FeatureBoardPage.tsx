import { useState } from 'react'
import { useAuth } from '@oxyhq/auth'
import { ExternalLink } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import FeatureCard from '../components/features/FeatureCard'
import FeatureFilters from '../components/features/FeatureFilters'
import { useFeatureRequests, useToggleFeatureVote, type FeatureRequestData } from '../api/hooks'

export default function FeatureBoardPage() {
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('votes')
  const [page, setPage] = useState(1)

  const { data, isPending, isError } = useFeatureRequests({
    status: status || undefined,
    category: category || undefined,
    sort,
    page,
  })

  const features = data?.items ?? []
  const totalPages = data?.pages ?? 1

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Feature Board"
        description="Vote on features you'd like to see in Oxy products. Powered by GitHub Issues."
        canonicalPath="/features"
      />
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="container relative">
            <div className="relative isolate border-x border-border">
              <div className="absolute bottom-0 left-0 z-10 h-[200px] w-full bg-[linear-gradient(to_bottom,transparent,var(--color-border))]" aria-hidden="true" />
              <svg width="100%" height="100%" className="mask-t-to-50% absolute inset-0 text-muted">
                <defs>
                  <pattern id="feature-hero-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                    <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#feature-hero-dots)" />
              </svg>

              <div className="relative z-20 grid grid-cols-12">
                <div className="relative col-[2/-2]">
                  <header className="flex w-full flex-col items-center pb-20 pt-28 max-lg:pb-16 max-lg:pt-20">
                    <div className="inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-foreground mb-6">
                      <h1>Feature Board</h1>
                    </div>
                    <h2 className="max-w-[20em] text-balance text-center text-heading-responsive-lg">
                      Shape the future of Oxy
                    </h2>
                    <p className="mt-4 max-w-xl text-balance text-center text-lg text-muted-foreground lg:text-xl">
                      Vote on features from across the Oxy ecosystem. Proposals are tracked on GitHub.
                    </p>
                    <a
                      href="https://github.com/oxyhq"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Suggest a Feature on GitHub
                    </a>
                  </header>
                </div>
              </div>
            </div>
          </div>
        </section>

        <svg width="100%" height="1" className="w-full text-border">
          <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
        </svg>

        {/* Content */}
        <div className="container pb-20 pt-8 lg:pb-28">
          <div className="mb-6">
            <FeatureFilters
              status={status}
              category={category}
              sort={sort}
              onChangeStatus={(v) => { setStatus(v); setPage(1) }}
              onChangeCategory={(v) => { setCategory(v); setPage(1) }}
              onChangeSort={(v) => { setSort(v); setPage(1) }}
            />
          </div>

          <div className="space-y-3">
            {isPending && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4 rounded-xl border border-border p-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-10 w-10 animate-pulse rounded-lg bg-surface" />
                      <div className="h-3 w-6 animate-pulse rounded bg-surface" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-surface" />
                      <div className="h-4 w-full animate-pulse rounded bg-surface" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-surface" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isError && !isPending && (
              <div className="py-20 text-center text-muted-foreground">
                <p className="text-lg">Failed to load feature requests.</p>
                <p className="mt-2 text-sm">Please try again later.</p>
              </div>
            )}

            {!isPending && !isError && features.length === 0 && (
              <div className="py-20 text-center text-muted-foreground">
                <p className="text-lg">No feature requests yet.</p>
                <p className="mt-2 text-sm">Be the first to suggest a feature on GitHub.</p>
              </div>
            )}

            {features.map((feature) => (
              <FeatureCardWithVote key={feature.id} feature={feature} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

function FeatureCardWithVote({ feature }: { feature: FeatureRequestData }) {
  const { isAuthenticated, signIn } = useAuth()
  const toggleVote = useToggleFeatureVote(feature.owner, feature.repoName, feature.number)

  function handleVote() {
    if (!isAuthenticated) {
      signIn()
      return
    }
    toggleVote.mutate()
  }

  return <FeatureCard feature={feature} onVote={handleVote} />
}
