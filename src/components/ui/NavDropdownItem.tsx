import { Link } from 'react-router-dom'
import type { NavDropdownItem as NavDropdownItemType } from '../../data/content'

interface NavDropdownItemProps {
  item: NavDropdownItemType
}

const linkClass = "group flex w-full items-center justify-start gap-x-3 rounded-xl border border-transparent p-2 transition-colors duration-300 hover:bg-surface"

function ItemContent({ item }: { item: NavDropdownItemType }) {
  return (
    <>
      {/* Icon placeholder with grid pattern */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-none border-0">
        <svg width="40" height="40" fill="none" className="absolute inset-0">
          <g
            className="stroke-black-500/40 transition-colors duration-150 group-hover:stroke-black-500/70"
            strokeWidth=".7"
            strokeMiterlimit="10"
          >
            <path d="M40 14H0M40 26H0M19.947 0 20 40" strokeDasharray="1.6 1.6" />
            <path d="M35 0v40M5 0v40M0 5h40M0 35h40" />
          </g>
        </svg>
        <div className="isolate flex h-10 w-10 items-center justify-center text-sm font-semibold text-blue-400">
          {item.title.charAt(0)}
        </div>
      </div>

      {/* Text content */}
      <div className="flex w-full min-w-0 flex-col pr-2">
        <div className="flex w-full items-baseline justify-between gap-1.5 text-primary-foreground">
          <span className="truncate text-sm">{item.title}</span>
          {/* Arrow icon — shows on hover */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="relative shrink-0 -translate-x-0.5 text-secondary-foreground opacity-0 transition-[opacity,translate] duration-300 ease-in-out group-hover:translate-x-0 group-hover:opacity-100"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.3536 6.35356C10.5488 6.1583 10.5488 5.84171 10.3536 5.64645L7.85355 3.14645C7.65829 2.95118 7.34171 2.95118 7.14645 3.14645C6.95118 3.34171 6.95118 3.65829 7.14645 3.85355L8.79289 5.5L2 5.50001C1.72386 5.50001 1.5 5.72386 1.5 6.00001C1.5 6.27615 1.72386 6.50001 2 6.50001L8.79289 6.5L7.14645 8.14645C6.95118 8.34171 6.95118 8.65829 7.14645 8.85355C7.34171 9.04882 7.65829 9.04882 7.85355 8.85355L10.3536 6.35356Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <p className="truncate text-sm text-accent-foreground">{item.description}</p>
      </div>
    </>
  )
}

export default function NavDropdownItem({ item }: NavDropdownItemProps) {
  if (item.href.startsWith('/')) {
    return (
      <Link to={item.href} className={linkClass}>
        <ItemContent item={item} />
      </Link>
    )
  }

  return (
    <a href={item.href} className={linkClass}>
      <ItemContent item={item} />
    </a>
  )
}
