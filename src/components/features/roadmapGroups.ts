/**
 * The roadmap's groups, in reading order.
 *
 * The statuses themselves are not invented here: the backend already derives
 * them from the issue's labels (`deriveStatus` in `server/services/featureBoard.ts`)
 * and the board already shows them one at a time. The roadmap is that same
 * field, grouped, from that same endpoint. A second source would eventually
 * disagree with the first, and then a proposal is planned on one screen and not
 * on the other.
 *
 * Order is what someone actually wants to know, in order: what is being built,
 * what is next, what is being considered, what has not been triaged. Shipped
 * and declined come last and start folded, because they are history rather than
 * plan. Folded, not hidden: a request that was declined for a reason is the
 * most useful thing on the page for whoever was about to file it again.
 */
export interface RoadmapGroup {
  status: string
  label: string
  description: string
  /** Tailwind classes for the group's colour dot. */
  dotClass: string
  /** Starts collapsed. */
  foldedByDefault: boolean
}

export const ROADMAP_GROUPS: readonly RoadmapGroup[] = [
  {
    status: 'in_progress',
    label: 'In progress',
    description: 'Being built right now.',
    dotClass: 'bg-warning',
    foldedByDefault: false,
  },
  {
    status: 'planned',
    label: 'Planned',
    description: 'Accepted and waiting for its turn.',
    dotClass: 'bg-primary',
    foldedByDefault: false,
  },
  {
    status: 'under_review',
    label: 'Under review',
    description: 'Being weighed up. Voting on these is what moves them.',
    dotClass: 'bg-info',
    foldedByDefault: false,
  },
  {
    status: 'open',
    label: 'Open proposals',
    description: 'Not triaged yet.',
    dotClass: 'bg-muted-foreground',
    foldedByDefault: false,
  },
  {
    status: 'completed',
    label: 'Shipped',
    description: 'Already delivered.',
    dotClass: 'bg-success',
    foldedByDefault: true,
  },
  {
    status: 'declined',
    label: 'Declined',
    description: 'Not going ahead. The issue says why.',
    dotClass: 'bg-error',
    foldedByDefault: true,
  },
]

/**
 * The org's engineering board.
 *
 * A deliberately different and wider set: every issue across both orgs, not
 * only the feature requests this board tracks. Linked as the detail rather than
 * merged in, because merging two sets with different membership rules produces
 * a view that answers neither question.
 */
export const ORG_ROADMAP_PROJECT_URL = 'https://github.com/orgs/OxyHQ/projects/14'
