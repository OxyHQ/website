import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

/**
 * From `lg`, hovering slides the arrow out through the left edge while a second
 * one arrives from the right, so the button reads as motion back toward the
 * index. Both exist at rest; only their offsets change, so nothing reflows.
 *
 * Below `lg` the row shares its width with the read time and the share button,
 * so the label drops — and with it the swap, which needs the label's width to
 * hide the incoming arrow in. Measured at 900px: with the label gone the button
 * is 58px wide and the waiting arrow sat at 52px, showing a 6px sliver of
 * itself. What is left there is one arrow, which is all the button means.
 */
export default function BackToNewsroomButton() {
  return (
    <Link
      to="/newsroom"
      aria-label="Back to Newsroom"
      className="group flex h-10 items-center overflow-hidden rounded-radius-max border-0 bg-fill-inverse px-4 text-bg transition-opacity hover:opacity-90"
    >
      <span className="relative flex flex-row-reverse items-center justify-between gap-2">
        {/* Parked its own width plus the button's right padding away, so it is
          * fully outside the clip whatever the label measures. A fixed 28px left
          * 6px of it showing at rest, in a 180px button. */}
        <span className="absolute hidden translate-x-[calc(100%+1rem)] transition-transform duration-300 will-change-transform group-hover:translate-x-0 group-hover:delay-100 lg:inline-block">
          <ArrowLeft size={18} weight="bold" />
        </span>
        <span className="hidden text-sm font-semibold transition-transform duration-300 will-change-transform group-hover:-translate-x-6 group-hover:delay-75 lg:block">
          Back to Newsroom
        </span>
        <span className="relative inline-block transition-transform duration-300 will-change-transform lg:group-hover:-translate-x-[calc(100%+1rem)]">
          <ArrowLeft size={18} weight="bold" />
        </span>
      </span>
    </Link>
  )
}
