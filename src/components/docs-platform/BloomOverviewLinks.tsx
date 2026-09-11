import { Link } from '../../lib/navigation'
const links = [
  {
    href: '/developers/docs/bloom/components',
    title: 'Component catalog',
    description: 'Browse every surface Bloom publishes and the props it declares.',
  },
  {
    href: '/developers/docs/bloom/playground',
    title: 'Component playground',
    description: 'Edit working Bloom code and watch it compile in your browser.',
  },
  {
    href: '/developers/docs/bloom/color-system',
    title: 'Color system playground',
    description: 'Compare every dynamic color recipe in light and dark.',
  },
] as const

/** Stable entry points from the versioned Bloom overview into live docs tools. */
export function BloomOverviewLinks() {
  return (
    <nav aria-label="Bloom interactive documentation" className="not-prose my-8 grid gap-3 sm:grid-cols-3">
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className="rounded-2xl border border-border bg-surface p-5 text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
        >
          <span className="block text-base font-semibold">{link.title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{link.description}</span>
        </Link>
      ))}
    </nav>
  )
}
