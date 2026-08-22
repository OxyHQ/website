import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

/** A quiet secondary action beside the article's primary share control. */
export default function BackToNewsroomButton() {
  return (
    <Link
      to="/newsroom"
      aria-label="Back to Newsroom"
      className="group flex min-h-10 items-center gap-2 rounded-full border border-primary/45 px-4 py-2 text-body-sm text-primary transition-colors hover:bg-primary/10"
    >
      <ArrowLeft size={18} weight="bold" className="transition-transform group-hover:-translate-x-0.5" />
      <span>Newsroom</span>
    </Link>
  )
}
