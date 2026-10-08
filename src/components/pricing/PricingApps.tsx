import { getBrandMark } from '../../data/brand-assets'
import { Link } from '../../lib/navigation'
import type { OneAudience } from '../../data/pricing'

const APPS = {
  alia: { name: 'Alia', href: 'https://alia.onl/' },
  mention: { name: 'Mention', href: '/mention/' },
  inbox: { name: 'Inbox', href: '/inbox/' },
  mercaria: { name: 'Mercaria', href: '/mercaria/' },
  homiio: { name: 'Homiio', href: '/homiio/' },
} as const

/** Product navigation, not a claim that every app feature is sold by a tier. */
export default function PricingApps({ audience }: { audience: OneAudience }) {
  const apps: (keyof typeof APPS)[] = audience === 'creator'
    ? ['alia', 'mention', 'mercaria']
    : ['alia', 'mention', 'inbox', 'mercaria', 'homiio']

  return (
    <ul data-pricing-apps className="mt-7 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-4">
      {apps.map(id => (
        <li key={id}>
          <Link to={APPS[id].href} className="flex items-center gap-2 text-sm text-foreground transition-opacity hover:opacity-70 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <img src={getBrandMark(id)} alt="" aria-hidden="true" width={28} height={28} className="size-7 shrink-0 rounded-md object-contain" />
            <span>{APPS[id].name}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
