import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface UnderlineLinkProps {
  href: string
  children: ReactNode
  /** Opens in a new tab, and routes through a plain anchor even for a site path. */
  external?: boolean
  /** Appended to the underline styles — sizing and placement live at the call site. */
  className?: string
}

const UNDERLINE_CLASSES =
  'text-primary relative inline cursor-pointer bg-underline bg-size-[220%_0.06em] bg-no-repeat transition-all bg-position-[100%_calc(100%_-_0.06em)] pb-0.5 duration-600 ease-underline hover:bg-position-[0%_calc(100%_-_0.06em)]'

/**
 * The inline link of this layout: a half-painted gradient twice the box width,
 * slid from right to left on hover so the underline wipes in.
 */
export default function UnderlineLink({ href, children, external, className = '' }: UnderlineLinkProps) {
  const classes = `${UNDERLINE_CLASSES} ${className}`.trim()

  if (external || !href.startsWith('/')) {
    return (
      <a className={classes} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  return (
    <Link className={classes} to={href}>
      {children}
    </Link>
  )
}
