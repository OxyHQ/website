import { Link } from 'react-router-dom'

interface SectionHeaderProps {
  title: string
  href: string
  linkText?: string
}

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

export default function SectionHeader({
  title,
  href,
  linkText = 'View all',
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-baseline justify-between">
      <h2 className="text-xl font-semibold tracking-[-0.01em] text-primary-foreground">
        {title}
      </h2>
      {href.startsWith('/') ? (
        <Link
          to={href}
          className="group flex items-center gap-1 text-sm font-medium text-tertiary-foreground transition-colors duration-200 hover:text-primary-foreground"
        >
          {linkText}
          <ArrowRight />
        </Link>
      ) : (
        <a
          href={href}
          className="group flex items-center gap-1 text-sm font-medium text-tertiary-foreground transition-colors duration-200 hover:text-primary-foreground"
        >
          {linkText}
          <ArrowRight />
        </a>
      )}
    </div>
  )
}
