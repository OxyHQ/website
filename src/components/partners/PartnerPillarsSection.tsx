import { Code, Compass, LockKeyOpen, UsersThree } from '@phosphor-icons/react'
import PhotoCardCarousel, { type PhotoCard } from '../sections/PhotoCardCarousel'

const PILLARS: readonly PhotoCard[] = [
  {
    visual: <div className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--primary)_18%,var(--background))] text-primary-text"><Code size={96} weight="duotone" aria-hidden="true" /></div>,
    title: 'Open by default',
    description: 'Every Oxy product ships with open-source code, public APIs, and self-host instructions. Build on top without lock-in.',
  },
  {
    visual: <div className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--secondary)_24%,var(--background))] text-primary-text"><LockKeyOpen size={96} weight="duotone" aria-hidden="true" /></div>,
    title: 'Privacy is the spec',
    description: 'No surveillance and no data brokering. Your users and their data stay in the hands of the people who create them.',
  },
  {
    visual: <div className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--tertiary)_22%,var(--background))] text-primary-text"><Compass size={96} weight="duotone" aria-hidden="true" /></div>,
    title: 'A real ecosystem',
    description: 'Plug into Mention, Inbox, Oxy AI, Homiio, and the rest of the stack through one identity layer and one contract.',
  },
  {
    visual: <div className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--accent)_24%,var(--background))] text-primary-text"><UsersThree size={96} weight="duotone" aria-hidden="true" /></div>,
    title: 'Built with people',
    description: 'Roadmaps shaped by partners and the community, not quarterly ad targets. We ship what users actually need.',
  },
]

export default function PartnerPillarsSection() {
  return (
    <PhotoCardCarousel
      title="Partnership without the compromise."
      description="The four things every Oxy partner gets, regardless of program."
      cards={PILLARS}
      variant="square"
    />
  )
}
