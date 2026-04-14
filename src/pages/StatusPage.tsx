import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import { useServiceStatus, type ServiceStatusEntry, type ServiceStatusValue } from '../api/hooks'

const STATUS_LABEL: Record<ServiceStatusValue, string> = {
  operational: 'Operational',
  degraded: 'Degraded performance',
  down: 'Outage',
  unknown: 'Checking…',
}

const STATUS_DOT: Record<ServiceStatusValue, string> = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-rose-500',
  unknown: 'bg-muted-foreground/50',
}

const STATUS_TEXT: Record<ServiceStatusValue, string> = {
  operational: 'text-emerald-600 dark:text-emerald-400',
  degraded: 'text-amber-600 dark:text-amber-400',
  down: 'text-rose-600 dark:text-rose-400',
  unknown: 'text-muted-foreground',
}

const OVERALL_HEADLINE: Record<ServiceStatusValue, string> = {
  operational: 'All systems operational.',
  degraded: 'Some systems are experiencing issues.',
  down: 'We have an active incident.',
  unknown: 'Checking service health…',
}

function StatusDot({ status, pulse = false }: { status: ServiceStatusValue; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
      {pulse && status !== 'unknown' && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${STATUS_DOT[status]}`} aria-hidden="true" />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
    </span>
  )
}

function formatLatency(ms: number | null): string {
  if (ms == null) return '—'
  if (ms < 1) return '<1 ms'
  return `${ms} ms`
}

function formatRelative(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime()
  if (delta < 0) return 'just now'
  const seconds = Math.floor(delta / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString()
}

function StatusRow({ service }: { service: ServiceStatusEntry }) {
  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 px-4 py-3 transition-colors duration-150 hover:bg-foreground/5"
    >
      <StatusDot status={service.status} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium text-foreground">{service.name}</span>
          <span className="truncate text-xs text-muted-foreground">{service.description}</span>
        </div>
      </div>
      <div className="hidden shrink-0 text-xs text-muted-foreground sm:block tabular-nums">
        {formatLatency(service.latencyMs)}
      </div>
      <div className={`shrink-0 text-xs font-medium ${STATUS_TEXT[service.status]}`}>
        {STATUS_LABEL[service.status]}
      </div>
    </a>
  )
}

function groupByCategory(services: ServiceStatusEntry[]): Array<[string, ServiceStatusEntry[]]> {
  const map = new Map<string, ServiceStatusEntry[]>()
  for (const svc of services) {
    const list = map.get(svc.category) ?? []
    list.push(svc)
    map.set(svc.category, list)
  }
  return Array.from(map.entries())
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-muted-foreground/20" />
      <div className="flex-1">
        <div className="h-3 w-40 rounded bg-muted-foreground/20" />
        <div className="mt-2 h-3 w-64 rounded bg-muted-foreground/10" />
      </div>
      <div className="h-3 w-12 rounded bg-muted-foreground/20" />
    </div>
  )
}

export default function StatusPage() {
  const { data, isLoading, isError, refetch, isFetching } = useServiceStatus()
  const overall: ServiceStatusValue = data?.overall ?? (isLoading ? 'unknown' : 'unknown')
  const headline = OVERALL_HEADLINE[overall]
  const grouped = data ? groupByCategory(data.services) : []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Status"
        description="Real-time health of every Oxy service, app, and infrastructure component."
        canonicalPath="/status"
      />
      <Navbar />

      <main className="flex-1">
        <div className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-16 max-lg:py-12">

                {/* Hero */}
                <div className="flex flex-col gap-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
                    <StatusDot status={overall} pulse />
                    System status
                  </span>
                  <h1 className="text-heading-responsive-lg font-serif font-semibold tracking-tight text-foreground">
                    {headline}
                  </h1>
                  <p className="max-w-2xl text-lg text-muted-foreground">
                    This dashboard probes every public Oxy service every minute. Click a row to open the service in a new tab.
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => refetch()}
                      disabled={isFetching}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isFetching ? 'Refreshing…' : 'Refresh now'}
                    </button>
                    {data && (
                      <span className="text-xs text-muted-foreground">
                        Last checked {formatRelative(data.generatedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Error */}
                {isError && !data && (
                  <div className="mt-10 rounded-xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-600 dark:text-rose-400">
                    Couldn't reach the status API. It may itself be down — try again in a moment.
                  </div>
                )}

                {/* Groups */}
                <div className="mt-10 flex flex-col gap-6">
                  {isLoading && !data && (
                    <section className="overflow-hidden rounded-2xl border border-border">
                      <header className="border-b border-border bg-surface/50 px-4 py-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loading…</h2>
                      </header>
                      <div className="divide-y divide-border">
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                      </div>
                    </section>
                  )}

                  {grouped.map(([category, services]) => (
                    <section key={category} className="overflow-hidden rounded-2xl border border-border">
                      <header className="flex items-center justify-between border-b border-border bg-surface/50 px-4 py-3">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</h2>
                        <span className="text-xs text-muted-foreground">{services.length} {services.length === 1 ? 'service' : 'services'}</span>
                      </header>
                      <div className="divide-y divide-border">
                        {services.map((service) => (
                          <StatusRow key={service.id} service={service} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><StatusDot status="operational" /> Operational</span>
                  <span className="inline-flex items-center gap-2"><StatusDot status="degraded" /> Degraded performance</span>
                  <span className="inline-flex items-center gap-2"><StatusDot status="down" /> Outage</span>
                  <span className="ml-auto">Data refreshes automatically every 60 seconds.</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
