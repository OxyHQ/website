import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'

/* ──────────────────────────────────────────────
 * <NextPrev prev={…} next={…} />
 *
 * In-content navigation block. Renders left/right cards that link to the
 * previous and next article. Either side is optional — render an empty
 * spacer cell when one is missing so the layout stays balanced.
 *
 *   <NextPrev
 *     prev={{ href: '/help/account/change-password', title: 'Change your password' }}
 *     next={{ href: '/help/account/delete-account', title: 'Delete your account' }}
 *   />
 * ──────────────────────────────────────────── */

interface NavLinkEntry {
  href: string
  title: string
}

interface NextPrevProps {
  prev?: NavLinkEntry | null
  next?: NavLinkEntry | null
}

export default function NextPrev({ prev, next }: NextPrevProps) {
  if (!prev && !next) return null
  return (
    <nav
      className="not-prose mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-2"
      aria-label="Article navigation"
    >
      {prev ? (
        <Link
          to={prev.href}
          className="group flex flex-col gap-1 rounded-2xl border border-border bg-background p-5 transition-colors hover:border-input hover:bg-surface"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Previous
          </span>
          <span className="text-base font-semibold text-foreground">{prev.title}</span>
        </Link>
      ) : (
        <div aria-hidden="true" />
      )}
      {next ? (
        <Link
          to={next.href}
          className="group flex flex-col items-end gap-1 rounded-2xl border border-border bg-background p-5 text-right transition-colors hover:border-input hover:bg-surface sm:col-start-2"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Next
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold text-foreground">{next.title}</span>
        </Link>
      ) : (
        <div aria-hidden="true" />
      )}
    </nav>
  )
}
