import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { FeatureAppOption } from '../../api/hooks'

/** Cards in the band. Enough to suggest breadth, few enough to stay a band. */
const MAX_SUGGESTIONS = 4
/** Below this many apps the band says nothing worth a row of the feed. */
const MIN_SUGGESTIONS = 2

interface FeatureInterstitialProps {
  apps: FeatureAppOption[]
  /** The app currently filtered to, which is not worth suggesting. */
  activeApp: string
}

/**
 * A recommendation band between feed rows.
 *
 * Mention interleaves these to widen a feed that would otherwise only ever show
 * more of the same (`components/Feed/interstitials/`), and it uses one shape in
 * two layouts: a horizontal scroller where vertical space is scarce, a vertical
 * list where the column is wide. The same shape fits here, suggesting the other
 * apps a visitor could be reading proposals for, since the board spans two orgs
 * and nothing else on the page says so.
 */
export default function FeatureInterstitial({ apps, activeApp }: FeatureInterstitialProps) {
  const suggestions = apps.filter((app) => app.key !== activeApp).slice(0, MAX_SUGGESTIONS)
  if (suggestions.length < MIN_SUGGESTIONS) return null

  return (
    <section className="border-b border-border px-4 py-4" aria-label="Other apps on the board">
      <h2 className="text-sm font-semibold text-foreground">Proposals for other apps</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        The board covers every Oxy app and FairCoin.
      </p>

      {/* Horizontal on a narrow column, vertical once there is room, which is
          the interstitial family's rule in Mention. */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible sm:pb-0">
        {suggestions.map((app) => (
          <Link
            key={app.key}
            to={`/features?app=${encodeURIComponent(app.key)}`}
            className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-border px-3 py-3 transition-colors hover:bg-surface sm:shrink"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{app.displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">{app.owner}/{app.repo}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  )
}
