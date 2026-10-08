import { RiArrowRightLine } from '@oxy.so/bloom/icons/RiArrowRightLine'
import FaqSection from './FaqSection'
import { Link } from '../../lib/navigation'

interface ResourceGroup {
  id?: string
  title: string
  links: readonly { href: string; label: string; external?: boolean }[]
}

/** The FAQ layout with direct resource links and a section palette chosen by its caller. */
export default function ResourceLinksSection({ id, title, groups, className = '' }: {
  id?: string
  title: string
  groups: readonly ResourceGroup[]
  className?: string
}) {
  return (
    <FaqSection
      id={id}
      title={title}
      className={`${className} flex min-h-[100svh] scroll-mt-[var(--site-header-occlusion-bottom)] items-center bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]`}
      groups={groups.map((group) => ({
        id: group.id,
        title: group.title,
        content: (
          <ul className="divide-y divide-border">
            {group.links.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="group flex items-center justify-between gap-4 px-4 py-5 text-lg font-medium leading-snug text-primary-text transition-colors hover:bg-background/40 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring md:text-xl"
                >
                  <span className="min-w-0">{link.label}</span>
                  <span aria-hidden="true" className="shrink-0 transition-transform group-hover:translate-x-1">
                    <RiArrowRightLine width={20} height={20} fill="currentColor" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ),
      }))}
    />
  )
}
