import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  className?: string
}

export default function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-muted-foreground ${className}`}
    >
      {children}
    </span>
  )
}
