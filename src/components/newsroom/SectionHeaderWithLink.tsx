import { Link } from 'react-router-dom'

interface SectionHeaderProps {
  title: string
  href: string
  linkText?: string
}

/* ─── Arrow icon for "View all" links ─── */
function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="ml-0.5 transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.1"
        d="M2.25 7h9.5m0 0L8.357 3.5M11.75 7l-3.393 3.5"
      />
    </svg>
  )
}

/* ──────────────────────────────────────────────────
 * Section header — title + "View all" link
 * Original: max-w-container mb-md flex items-baseline justify-between
 * Title: text-h4 text-primary-100
 * Link: text-button variant
 * ────────────────────────────────────────────── */
export default function SectionHeader({
  title,
  href,
  linkText = 'View all',
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-baseline justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </h2>
      </div>
      {href.startsWith('/') ? (
        <Link
          to={href}
          className="group flex min-h-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          {linkText}
          <ArrowRight />
        </Link>
      ) : (
        <a
          href={href}
          className="group flex min-h-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          {linkText}
          <ArrowRight />
        </a>
      )}
    </div>
  )
}
