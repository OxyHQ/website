import type { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
}

/**
 * Thin wrapper around the site-global `.container` class so legacy callers
 * (Section.tsx + a few hero/partner sections) inherit the same responsive
 * breakpoints (caps at 1760px on >=1920px viewports) as pages that consume
 * `.container` directly. New code should prefer `<div className="container">`.
 */
export default function Container({ children, className = '' }: ContainerProps) {
  const classes = ['container', className].filter(Boolean).join(' ')
  return <div className={classes}>{children}</div>
}
