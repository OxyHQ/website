import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

/**
 * On hover the arrow leaves through the left edge while a second one arrives
 * from the right, so the button reads as motion back toward the index. Both
 * arrows exist at rest; only their offsets change, so nothing reflows.
 */
export default function BackToNewsroomButton() {
  return (
    <Link
      to="/newsroom"
      className="group flex h-10 items-center overflow-hidden rounded-radius-8 bg-fill-inverse px-3 text-bg transition-opacity hover:opacity-90"
    >
      <span className="relative flex flex-row-reverse items-center justify-between gap-2">
        <span className="absolute inline-block translate-x-7 transition-transform duration-300 will-change-transform group-hover:translate-x-0 group-hover:delay-100">
          <ArrowLeft size={18} weight="bold" />
        </span>
        <span className="text-sm font-semibold transition-transform duration-300 will-change-transform group-hover:-translate-x-6 group-hover:delay-75">
          Back to Newsroom
        </span>
        <span className="relative inline-block transition-transform duration-300 will-change-transform group-hover:-translate-x-7">
          <ArrowLeft size={18} weight="bold" />
        </span>
      </span>
    </Link>
  )
}
