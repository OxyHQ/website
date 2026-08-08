import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@oxyhq/services'
import * as Skeleton from '@oxyhq/bloom/skeleton'
import { Plus } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import FeatureRow from '../components/features/FeatureRow'
import FeatureFilters from '../components/features/FeatureFilters'
import FeatureSearch from '../components/features/FeatureSearch'
import FeatureInterstitial from '../components/features/FeatureInterstitial'
import ProposeFeatureDialog from '../components/features/ProposeFeatureDialog'
import RoadmapView from '../components/features/RoadmapView'
import BoardShell from '../components/features/shell/BoardShell'
import { PanelHeader, PanelTabs, type PanelTab } from '../components/features/shell/PanelBars'
import BoardRail from '../components/features/BoardRail'
import { RAIL_QUERY } from '../components/features/shell/boardChrome'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useFeatureApps, useFeatureRequests } from '../api/hooks'

const TABS: readonly PanelTab[] = [
  { key: 'board', label: 'Board' },
  { key: 'roadmap', label: 'Roadmap' },
]

/** Proposals the roadmap pulls in one go. Matches the API's page ceiling. */
const ROADMAP_PAGE_SIZE = 100

/** Rows before the recommendation band. Late enough that the feed reads first. */
const INTERSTITIAL_AFTER_ROW = 5

export default function FeatureBoardPage() {
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('votes')
  const [page, setPage] = useState(1)
  const [proposeOpen, setProposeOpen] = useState(false)
  const { isAuthenticated, signIn } = useAuth()
  const showRail = useMediaQuery(RAIL_QUERY)

  // The app filter, the tab and the search term live in the URL: a filtered
  // board, the roadmap and a search are all things worth linking to, and it
  // gives the app chip on a proposal's own page somewhere to point.
  const [searchParams, setSearchParams] = useSearchParams()
  const app = searchParams.get('app') ?? ''
  const query = searchParams.get('q') ?? ''
  const view = searchParams.get('view') === 'roadmap' ? 'roadmap' : 'board'

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next, { replace: true })
    setPage(1)
  }

  const board = useFeatureRequests({
    status: status || undefined,
    app: app || undefined,
    sort,
    page,
    q: query || undefined,
  })

  // One extra read, shared by the roadmap tab and the rail's summary, and
  // skipped when neither is on screen. `state: 'all'` is the point of it: a
  // shipped proposal is closed on GitHub and the board's default hides it.
  const roadmap = useFeatureRequests(
    { app: app || undefined, state: 'all', sort: 'votes', limit: ROADMAP_PAGE_SIZE },
    { enabled: view === 'roadmap' || showRail },
  )

  const { data: appsData } = useFeatureApps()
  const apps = appsData?.apps ?? []
  const canPropose = apps.some((option) => option.acceptsProposals)

  const features = board.data?.items ?? []
  const totalPages = board.data?.pages ?? 1

  // Signing in is what a visitor needs first; the form is no use without an
  // account, since the proposal is attributed to it on GitHub.
  function handleProposeClick() {
    if (!isAuthenticated) {
      signIn()
      return
    }
    setProposeOpen(true)
  }

  const proposeButton = canPropose ? (
    <button
      onClick={handleProposeClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-body-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <Plus className="h-3.5 w-3.5" />
      Propose
    </button>
  ) : undefined

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Feature requests"
        description="What people are asking for across the Oxy apps, what is planned and what already shipped."
        canonicalPath="/features"
      />
      <Navbar />

      <main className="flex-1">
        <BoardShell
          header={
            <PanelHeader
              title="Feature board"
              subtitle={view === 'roadmap' ? 'What is planned and what shipped' : 'Vote on what Oxy builds next'}
              action={proposeButton}
            />
          }
          tabs={<PanelTabs tabs={TABS} active={view} onSelect={(key) => setParam('view', key === 'board' ? '' : key)} />}
          rail={
            <BoardRail
              query={query}
              onQueryChange={(value) => setParam('q', value)}
              statusCounts={roadmap.data?.statusCounts ?? {}}
              onOpenRoadmap={() => setParam('view', 'roadmap')}
            />
          }
        >
          {view === 'roadmap' ? (
            <RoadmapView
              items={roadmap.data?.items ?? []}
              statusCounts={roadmap.data?.statusCounts ?? {}}
              isPending={roadmap.isPending}
              truncated={(roadmap.data?.total ?? 0) > ROADMAP_PAGE_SIZE}
            />
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
                {/* The rail carries the search above 990px. Below that the rail
                    is not rendered at all, so it moves in here rather than
                    existing twice in the document. */}
                {!showRail && (
                  <FeatureSearch value={query} onChange={(value) => setParam('q', value)} />
                )}
                <FeatureFilters
                  status={status}
                  app={app}
                  sort={sort}
                  apps={apps}
                  onChangeStatus={(value) => { setStatus(value); setPage(1) }}
                  onChangeApp={(value) => setParam('app', value)}
                  onChangeSort={(value) => { setSort(value); setPage(1) }}
                />
              </div>

              {board.isPending && (
                <div className="flex flex-col">
                  {[1, 2, 3, 4].map((row) => (
                    <div key={row} className="flex gap-3 border-b border-border px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <Skeleton.Box width={36} height={36} borderRadius={18} />
                        <Skeleton.Box width={20} height={10} borderRadius={4} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Skeleton.Box width="66%" height={18} borderRadius={4} />
                        <Skeleton.Box width="100%" height={14} borderRadius={4} />
                        <Skeleton.Box width="33%" height={10} borderRadius={4} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {board.isError && !board.isPending && (
                <div className="px-4 py-16 text-center text-muted-foreground">
                  <p>Failed to load feature requests.</p>
                  <p className="mt-2 text-sm">Please try again later.</p>
                </div>
              )}

              {!board.isPending && !board.isError && features.length === 0 && (
                <div className="px-4 py-16 text-center text-muted-foreground">
                  {query ? (
                    <>
                      <p>Nothing found for &ldquo;{query}&rdquo;.</p>
                      <p className="mt-2 text-sm">Try fewer words, or clear the app filter.</p>
                    </>
                  ) : (
                    <>
                      <p>No feature requests yet.</p>
                      <p className="mt-2 text-sm">
                        {canPropose ? 'Be the first to propose one.' : 'Check back soon.'}
                      </p>
                    </>
                  )}
                </div>
              )}

              {features.map((feature, index) => (
                <div key={feature.id}>
                  <FeatureRow feature={feature} hideApp={Boolean(app)} />
                  {index === INTERSTITIAL_AFTER_ROW && !app && !query && (
                    <FeatureInterstitial apps={apps} activeApp={app} />
                  )}
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 px-4 py-6">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                    className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-default disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages}
                    className="cursor-pointer rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-default disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </BoardShell>
      </main>

      {appsData && (
        <ProposeFeatureDialog
          open={proposeOpen}
          onClose={() => setProposeOpen(false)}
          apps={apps}
          limits={appsData.limits}
        />
      )}

      {/* The rail carries the legal links and the credit line where it is
          shown, so the site footer would be a second copy of both. Below the
          rail's breakpoint it is the only one left, and it comes back. */}
      {!showRail && <Footer />}
    </div>
  )
}
