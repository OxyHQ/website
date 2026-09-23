import { Link } from '../../../lib/navigation'
import { RiArrowLeftLine } from '@oxy.so/bloom/icons/RiArrowLeftLine'

/** A quiet secondary action beside the article's primary share control. */
export default function BackToNewsroomButton() {
  return (
    <Link
      to="/newsroom"
      aria-label="Back to Newsroom"
      className="group flex min-h-10 items-center gap-2 rounded-full border border-primary/45 px-4 py-2 text-body-sm text-primary transition-colors hover:bg-primary/10"
    >
      <span className="inline-flex transition-transform group-hover:-translate-x-0.5" aria-hidden="true">
        <RiArrowLeftLine width={18} height={18} fill="currentColor" />
      </span>
      <span>Newsroom</span>
    </Link>
  )
}
