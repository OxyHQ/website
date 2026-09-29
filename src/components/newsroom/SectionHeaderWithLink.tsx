import { Link } from '../../lib/navigation'
import { RiArrowRightLine } from '@oxy.so/bloom/icons/RiArrowRightLine'

interface SectionHeaderWithLinkProps {
  title: string
  href: string
  linkText?: string
}

/* ──────────────────────────────────────────────────
 * Section header — title + "View all" link
 * ────────────────────────────────────────────── */
export default function SectionHeaderWithLink({
  title,
  href,
  linkText = 'View all',
}: SectionHeaderWithLinkProps) {
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
          <span aria-hidden="true" className="inline-flex ml-0.5 transition-transform duration-200 group-hover:translate-x-0.5"><RiArrowRightLine width={14} height={14} fill="currentColor" /></span>
        </Link>
      ) : (
        <a
          href={href}
          className="group flex min-h-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          {linkText}
          <span aria-hidden="true" className="inline-flex ml-0.5 transition-transform duration-200 group-hover:translate-x-0.5"><RiArrowRightLine width={14} height={14} fill="currentColor" /></span>
        </a>
      )}
    </div>
  )
}
