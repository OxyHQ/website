import { Link } from 'react-router-dom'
import { APP_CARD_IMAGES } from '../../data/appCardImages'

export type CommunityProfileCard = {
  type: 'profile'
  image: string
  logo?: string
  name: string
  role: string
  href: string
  descriptionClassName?: string
  theme?: 'mention-theme' | 'allo-theme' | 'faircoin-theme' | 'homiio-theme' | 'mercaria-theme' | 'inbox-theme' | 'astro-card-theme' | 'oxyos-card-theme'
}

/** App cards reused by the homepage app showcase. */
export const APP_PROFILE_CARDS: CommunityProfileCard[] = [
  {
    type: 'profile',
    image: APP_CARD_IMAGES['/mention'],
    logo: '/images/apps/mention.png',
    name: 'Mention',
    role: 'An open social network for genuine connection',
    href: '/mention',
    descriptionClassName: 'text-accent-tertiary',
    theme: 'mention-theme',
  },
  {
    type: 'profile',
    image: APP_CARD_IMAGES['/apps/allo'],
    logo: '/images/apps/allo.png',
    name: 'Allo',
    role: 'Private conversations, built together',
    href: '/apps/allo',
    descriptionClassName: 'text-accent-tertiary',
    theme: 'allo-theme',
  },
  {
    type: 'profile',
    image: APP_CARD_IMAGES['/apps/faircoin'],
    logo: '/images/apps/faircoin.svg',
    name: 'FairCoin',
    role: 'A community-run currency for cooperation',
    href: '/faircoin',
    descriptionClassName: 'text-accent-tertiary',
    theme: 'faircoin-theme',
  },
  {
    type: 'profile',
    image: APP_CARD_IMAGES['/homiio'],
    name: 'Homiio',
    role: 'Housing made fair',
    href: '/homiio',
    descriptionClassName: 'text-accent-secondary',
    theme: 'homiio-theme',
  },
  {
    type: 'profile',
    image: APP_CARD_IMAGES['/mercaria'],
    logo: '/images/apps/mercaria.svg',
    name: 'Mercaria',
    role: 'An open marketplace for fair, human-centered commerce',
    href: '/mercaria',
    descriptionClassName: 'text-accent-primary',
    theme: 'mercaria-theme',
  },
]

export function CommunityProfileCardView({ card, className = '' }: { card: CommunityProfileCard; className?: string }) {
  const content = (
    <article className={`${card.theme ?? ''} relative flex h-[360px] w-full shrink-0 flex-col overflow-hidden rounded-[32px] bg-[color-mix(in_srgb,var(--primary)_32%,var(--background))] p-8 md:h-[480px] md:w-96 ${className}`}>
      <div className="relative z-20 flex flex-col gap-1">
        <p className="heading-3xl text-[32px] font-semibold text-primary-text">{card.name}</p>
        <p className={`heading-xl text-sm font-medium ${card.descriptionClassName ?? 'text-secondary-text'}`}>{card.role}</p>
      </div>
      <div className="relative -mx-8 -mb-8 min-h-0 flex-1">
        <img
          src={card.image}
          alt={card.name}
          className="absolute inset-0 size-full select-none object-cover object-center"
          width={768}
          height={480}
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[60%] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--primary)_32%,var(--background))_0%,color-mix(in_srgb,var(--primary)_24%,transparent)_60%,transparent_100%)]" />
      </div>
    </article>
  )

  return <Link to={card.href} className="block h-full rounded-[32px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tertiary">{content}</Link>
}
