import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  className?: string
}

export default function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-subtle-stroke bg-surface-subtle px-3 py-1 text-sm font-medium text-tertiary-foreground ${className}`}
    >
      {children}
    </span>
  )
}
