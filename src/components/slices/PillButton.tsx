import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface PillButtonProps {
  href: string
  children: ReactNode
  /** Opens in a new tab, and routes through a plain anchor even for a site path. */
  external?: boolean
  variant?: 'solid' | 'outline'
  size?: 'md' | 'lg'
  className?: string
}

const VARIANTS = {
  solid: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-primary/45 text-primary hover:bg-primary/10',
} as const

const SIZES = {
  md: 'px-5.5 py-2.5 text-b1',
  lg: 'px-6 py-3.5 text-b1',
} as const

/** The system's one button: a pill, solid by default, outlined as the second action. */
export default function PillButton({
  href,
  children,
  external,
  variant = 'solid',
  size = 'md',
  className = '',
}: PillButtonProps) {
  const classes = `relative block w-fit cursor-pointer rounded-full outline-none transition-all duration-200 ease-impulse ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim()

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
