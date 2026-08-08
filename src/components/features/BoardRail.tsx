import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import FeatureSearch from './FeatureSearch'
import { ORG_ROADMAP_PROJECT_URL, ROADMAP_GROUPS } from './roadmapGroups'

/**
 * Legal links and the credit line, in the rail rather than in a page footer.
 *
 * This is where Mention puts them (`components/RightBar.tsx`), and the same
 * reasoning holds: the rail is standing furniture, so the boilerplate can live
 * at the bottom of it and the feed can end where its content ends. The site's
 * own `Footer` takes over below the rail's breakpoint, so exactly one of the
 * two is on screen at any width.
 */
const FOOTER_LINKS = [
  { label: 'Legal', to: '/legal' },
  { label: 'Privacy', to: '/company/transparency/policies/privacy' },
  { label: 'Terms', to: '/company/transparency/policies/terms-of-service' },
  { label: 'Cookies', to: '/company/transparency/policies/cookies' },
] as const

interface BoardRailProps {
  query: string
  onQueryChange: (value: string) => void
  /** Per-status totals from the list response, for the roadmap summary. */
  statusCounts: Record<string, number>
  onOpenRoadmap: () => void
}

export default function BoardRail({ query, onQueryChange, statusCounts, onOpenRoadmap }: BoardRailProps) {
  const summary = ROADMAP_GROUPS.map((group) => ({
    ...group,
    count: statusCounts[group.status] ?? 0,
  })).filter((group) => group.count > 0)

  return (
    <div className="flex flex-col gap-4 pb-6 pt-2">
      <FeatureSearch value={query} onChange={onQueryChange} />

      {summary.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-body-md font-semibold text-foreground">Roadmap at a glance</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {summary.map((group) => (
              <li key={group.status} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${group.dotClass}`} aria-hidden />
                  <span className="truncate">{group.label}</span>
                </span>
                <span className="shrink-0 font-medium text-foreground">{group.count}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={onOpenRoadmap}
            className="mt-3 cursor-pointer text-sm font-medium text-foreground transition-opacity hover:opacity-70"
          >
            Open the roadmap
          </button>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-body-md font-semibold text-foreground">How this works</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every proposal here is a real issue on GitHub. Votes from this site and reactions there are
          counted together, and the total sets a priority label on the issue, so what you vote for is
          what the people building it see.
        </p>
        <a
          href={ORG_ROADMAP_PROJECT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-opacity hover:opacity-70"
        >
          Engineering detail on GitHub
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      <footer className="flex flex-col">
        <div className="flex flex-row flex-wrap">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="pb-1 pr-3 text-body-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="pt-0.5 text-body-xs text-muted-foreground">Made with love in the world by Oxy.</p>
      </footer>
    </div>
  )
}
