import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import { useServiceStatus, type ServiceStatusEntry, type ServiceStatusValue } from '../api/hooks'

const STATUS_LABEL: Record<ServiceStatusValue, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Outage',
  unknown: 'Checking…',
}

const STATUS_DOT: Record<ServiceStatusValue, string> = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-rose-500',
  unknown: 'bg-muted-foreground/50',
}

const STATUS_SURFACE: Record<ServiceStatusValue, string> = {
  operational: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  degraded: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  down: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  unknown: 'bg-muted-foreground/10 text-muted-foreground',
}

const OVERALL_HEADLINE: Record<ServiceStatusValue, string> = {
  operational: 'All systems operational.',
  degraded: 'Some systems are experiencing issues.',
  down: 'We have an active incident.',
  unknown: 'Checking service health…',
}

const OVERALL_KICKER: Record<ServiceStatusValue, string> = {
  operational: 'Every Oxy service is up and responding quickly.',
  degraded: 'At least one service is responding slower than usual.',
  down: 'At least one service is unreachable. Our team is on it.',
  unknown: 'Running the first probe batch now.',
}

function DashedHLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

function StatusDot({ status, pulse = false, size = 'md' }: { status: ServiceStatusValue; pulse?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-3 w-3' : size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
  return (
    <span className={`relative inline-flex shrink-0 ${sizeClass}`} aria-hidden="true">
      {pulse && status !== 'unknown' && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${STATUS_DOT[status]}`} />
      )}
      <span className={`relative inline-flex rounded-full ${sizeClass} ${STATUS_DOT[status]}`} />
    </span>
  )
}

function ServiceLogo({ service }: { service: ServiceStatusEntry }) {
  const hasLogo = Boolean(service.logoUrl)
  const style = hasLogo
    ? undefined
    : { backgroundColor: service.brand, color: service.brandForeground || '#ffffff' }
  return (
    <span
      className={`relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-base font-semibold tracking-tight ${
        hasLogo ? 'bg-surface border border-border/60' : ''
      }`}
      style={style}
      aria-hidden="true"
    >
      {hasLogo ? (
        <img
          src={service.logoUrl ?? ''}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        service.mark || '?'
      )}
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

function ServiceRow({ service }: { service: ServiceStatusEntry }) {
  return (
    <div className="group relative flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-foreground/5">
      {/* brand accent strip on hover */}
      <span
        className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100"
        style={{ backgroundColor: service.brand }}
        aria-hidden="true"
      />
      <ServiceLogo service={service} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium text-foreground">{service.name}</span>
          {service.landingUrl && (
            <Link
              to={service.landingUrl}
              className="hidden text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline sm:inline"
            >
              Learn more
            </Link>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{service.description}</div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <div className="text-xs font-mono tabular-nums text-muted-foreground">{formatLatency(service.latencyMs)}</div>
        {service.httpStatus != null && (
          <div className="text-[10px] font-mono tabular-nums text-muted-foreground/70">HTTP {service.httpStatus}</div>
        )}
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${STATUS_SURFACE[service.status]}`}
      >
        <StatusDot status={service.status} size="sm" />
        {STATUS_LABEL[service.status]}
      </span>
      <a
        href={service.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-background md:inline-flex md:items-center md:gap-1"
      >
        Open
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-3" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      </a>
    </div>
  )
}

function groupByCategory(services: ServiceStatusEntry[]): Array<[string, ServiceStatusEntry[]]> {
  const map = new Map<string, ServiceStatusEntry[]>()
  for (const svc of services) {
    const list = map.get(svc.section) ?? []
    list.push(svc)
    map.set(svc.section, list)
  }
  return Array.from(map.entries())
}

function SectionHealth({ services }: { services: ServiceStatusEntry[] }) {
  const down = services.filter((s) => s.status === 'down').length
  const degraded = services.filter((s) => s.status === 'degraded').length
  const operational = services.filter((s) => s.status === 'operational').length
  const overall: ServiceStatusValue = down > 0 ? 'down' : degraded > 0 ? 'degraded' : operational === services.length ? 'operational' : 'unknown'
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${STATUS_SURFACE[overall]}`}>
      <StatusDot status={overall} size="sm" />
      {STATUS_LABEL[overall]}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface/30">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="h-3 w-32 animate-pulse rounded bg-muted-foreground/20" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-muted-foreground/20" />
      </header>
      <div className="divide-y divide-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-muted-foreground/20" />
            <div className="flex-1">
              <div className="h-3 w-32 animate-pulse rounded bg-muted-foreground/20" />
              <div className="mt-2 h-3 w-64 animate-pulse rounded bg-muted-foreground/10" />
            </div>
            <div className="h-5 w-20 animate-pulse rounded-full bg-muted-foreground/20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StatusPage() {
  const { data, isLoading, isError, refetch, isFetching } = useServiceStatus()
  const overall: ServiceStatusValue = data?.overall ?? 'unknown'
  const headline = OVERALL_HEADLINE[overall]
  const kicker = OVERALL_KICKER[overall]
  const grouped = data ? groupByCategory(data.services) : []
  const totals = data
    ? {
        total: data.services.length,
        operational: data.services.filter((s) => s.status === 'operational').length,
        degraded: data.services.filter((s) => s.status === 'degraded').length,
        down: data.services.filter((s) => s.status === 'down').length,
      }
    : null

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Status"
        description="Real-time health of every Oxy service, app, and infrastructure component."
        canonicalPath="/status"
      />
      <Navbar />

      <main className="flex-1">
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] pt-24 pb-16 max-lg:pt-20 max-lg:pb-12">
                <div className="flex flex-col items-start gap-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-foreground">
                    <StatusDot status={overall} pulse size="md" />
                    System status
                  </span>
                  <h1 className="max-w-[18em] text-balance text-heading-responsive-lg text-foreground">
                    {headline}
                  </h1>
                  <p className="max-w-2xl text-pretty text-lg text-muted-foreground">{kicker}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => refetch()}
                      disabled={isFetching}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className={`size-4 ${isFetching ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      {isFetching ? 'Refreshing…' : 'Refresh now'}
                    </button>
                    {data && (
                      <span className="text-xs text-muted-foreground">Last checked {formatRelative(data.generatedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary strip */}
            {totals && (
              <>
                <DashedHLine />
                <div className="grid grid-cols-4 gap-0 border-t border-border">
                  {[
                    { label: 'Services', value: totals.total, tone: '' as const },
                    { label: 'Operational', value: totals.operational, tone: 'operational' as ServiceStatusValue },
                    { label: 'Degraded', value: totals.degraded, tone: 'degraded' as ServiceStatusValue },
                    { label: 'Outage', value: totals.down, tone: 'down' as ServiceStatusValue },
                  ].map((stat, idx) => (
                    <div
                      key={stat.label}
                      className={`flex flex-col gap-1 p-5 ${idx > 0 ? 'border-l border-border' : ''}`}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {stat.tone && <StatusDot status={stat.tone} size="sm" />}
                        {stat.label}
                      </div>
                      <div className="text-3xl font-medium tabular-nums text-foreground">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ═══ Services list ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <header className="grid grid-cols-12 pt-16 pb-10 max-lg:pt-12 max-lg:pb-8 justify-items-start">
              <div className="col-[2/-2] flex w-full items-end justify-between gap-6">
                <div className="max-w-[28em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                  <h2 className="text-pretty inline">Every service, in one place.</h2>{' '}
                  <p className="inline text-pretty font-medium text-muted-foreground">
                    Probed every 60 seconds from Oxy infrastructure. Click any row to open the service in a new tab.
                  </p>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-12">
              <div className="col-[2/-2] flex flex-col gap-5 pb-20">
                {/* Error state */}
                {isError && !data && (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-5 text-sm text-rose-600 dark:text-rose-400">
                    Couldn't reach the status API. It may itself be down — try again in a moment.
                  </div>
                )}

                {/* Loading state */}
                {isLoading && !data && (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                )}

                {/* Grouped service cards */}
                {grouped.map(([section, services]) => (
                  <section
                    key={section}
                    className="overflow-hidden rounded-3xl border border-border bg-background shadow-sm"
                  >
                    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface/40 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-semibold text-foreground">{section}</h3>
                        <span className="text-xs text-muted-foreground">
                          {services.length} {services.length === 1 ? 'service' : 'services'}
                        </span>
                      </div>
                      <SectionHealth services={services} />
                    </header>
                    <div className="divide-y divide-border">
                      {services.map((service) => (
                        <ServiceRow key={service.id} service={service} />
                      ))}
                    </div>
                  </section>
                ))}

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><StatusDot status="operational" size="sm" /> Operational (&lt;1.5s)</span>
                  <span className="inline-flex items-center gap-2"><StatusDot status="degraded" size="sm" /> Degraded (&gt;1.5s)</span>
                  <span className="inline-flex items-center gap-2"><StatusDot status="down" size="sm" /> Outage</span>
                  <span className="ml-auto">Data refreshes automatically every 60 seconds.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
