import Badge from './Badge'

interface SectionHeaderProps {
  badge?: string
  title: string
  subtitle?: string
  centered?: boolean
  headingSize?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function SectionHeader({
  badge,
  title,
  subtitle,
  centered = true,
  headingSize = 'lg',
  className = '',
}: SectionHeaderProps) {
  const headingClass = `text-heading-responsive-${headingSize}`
  const alignment = centered ? 'items-center text-center' : 'items-start text-left'

  return (
    <header className={`flex w-full flex-col ${alignment} ${className}`}>
      {badge && <Badge className="mb-4">{badge}</Badge>}
      <h2 className={`${headingClass} text-pretty text-primary-foreground`}>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 max-w-2xl text-pretty text-lg text-tertiary-foreground">
          {subtitle}
        </p>
      )}
    </header>
  )
}
