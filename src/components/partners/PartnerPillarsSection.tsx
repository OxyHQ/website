import { RiCodeLine } from '@oxy.so/bloom/icons/RiCodeLine'
import { RiCompass3Line } from '@oxy.so/bloom/icons/RiCompass3Line'
import { RiLockUnlockLine } from '@oxy.so/bloom/icons/RiLockUnlockLine'
import { RiTeamLine } from '@oxy.so/bloom/icons/RiTeamLine'
import PhotoCardCarousel, { type PhotoCard } from '../sections/PhotoCardCarousel'

const PILLARS: readonly PhotoCard[] = [
  {
    visual: <div className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--primary)_18%,var(--background))] text-primary-text"><RiCodeLine width={96} height={96} fill="currentColor" aria-hidden /></div>,
    title: 'Open by default',
    description: 'Every Oxy product ships with open-source code, public APIs, and self-host instructions. Build on top without lock-in.',
  },
  {
    visual: <div className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--secondary)_24%,var(--background))] text-primary-text"><RiLockUnlockLine width={96} height={96} fill="currentColor" aria-hidden /></div>,
    title: 'Privacy is the spec',
    description: 'No surveillance and no data brokering. Your users and their data stay in the hands of the people who create them.',
  },
  {
    visual: <div className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--tertiary)_22%,var(--background))] text-primary-text"><RiCompass3Line width={96} height={96} fill="currentColor" aria-hidden /></div>,
    title: 'A real ecosystem',
    description: 'Plug into Mention, Inbox, Oxy AI, Homiio, and the rest of the stack through one identity layer and one contract.',
  },
  {
    visual: <div className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--accent)_24%,var(--background))] text-primary-text"><RiTeamLine width={96} height={96} fill="currentColor" aria-hidden /></div>,
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
