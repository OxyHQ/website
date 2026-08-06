import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react'
import FeatureRow from './FeatureRow'
import { ORG_ROADMAP_PROJECT_URL, ROADMAP_GROUPS } from './roadmapGroups'
import type { FeatureRequestData } from '../../api/hooks'

interface RoadmapViewProps {
  /** Every proposal, open and closed. Grouped here, not on the server. */
  items: FeatureRequestData[]
  /** Per-status totals for the whole board, which survive the page cap. */
  statusCounts: Record<string, number>
  /** True while the first page is still loading. */
  isPending: boolean
  /** The board holds more proposals than one response carries. */
  truncated: boolean
}

/**
 * The roadmap: the same proposals the board lists, grouped by the status the
 * backend already derives from each issue's labels.
 *
 * Fed by the same endpoint as the board, asked for `state=all` because a
 * shipped request is closed on GitHub and a roadmap missing everything
 * delivered is missing its best news.
 */
export default function RoadmapView({ items, statusCounts, isPending, truncated }: RoadmapViewProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const groups = ROADMAP_GROUPS.map((group) => ({
    ...group,
    // The count comes from the server's tally over the whole board; the rows
    // come from the page we were given. They can differ, and the count is the
    // honest number.
    count: statusCounts[group.status] ?? 0,
    rows: items.filter((item) => item.status === group.status),
  })).filter((group) => group.count > 0)

  if (isPending) {
    return <p className="px-4 py-10 text-sm text-muted-foreground">Loading the roadmap...</p>
  }

  if (groups.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-muted-foreground">Nothing on the roadmap yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Proposals appear here once they carry a status label.
        </p>
      </div>
    )
  }

  return (
    <div>
      {groups.map((group) => {
        const open = expanded[group.status] ?? !group.foldedByDefault
        return (
          <section key={group.status}>
            <button
              onClick={() => setExpanded({ ...expanded, [group.status]: !open })}
              aria-expanded={open}
              className="flex w-full cursor-pointer items-center gap-2 border-b border-border bg-surface/40 px-4 py-2.5 text-left transition-colors hover:bg-surface"
            >
              {open
                ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
              <span className={`h-2 w-2 shrink-0 rounded-full ${group.dotClass}`} aria-hidden />
              <span className="text-sm font-semibold text-foreground">{group.label}</span>
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {group.count}
              </span>
              <span className="ml-1 hidden truncate text-xs text-muted-foreground sm:block">
                {group.description}
              </span>
            </button>

            {open && group.rows.map((feature) => (
              <FeatureRow key={feature.id} feature={feature} />
            ))}

            {open && group.rows.length === 0 && (
              <p className="border-b border-border px-4 py-4 text-sm text-muted-foreground">
                {group.count} in this group, beyond what this page loaded.
              </p>
            )}
          </section>
        )
      })}

      <div className="px-4 py-6">
        {truncated && (
          <p className="mb-3 text-xs text-muted-foreground">
            This page shows the most voted proposals in each group. The counts above cover the whole board.
          </p>
        )}
        <a
          href={ORG_ROADMAP_PROJECT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Engineering detail: every issue across both orgs, on the Oxy Roadmap project
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}
