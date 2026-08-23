import { useEffect } from 'react'
import { useDialogControl } from '@oxyhq/bloom/dialog'
import { RocketLaunch } from '@phosphor-icons/react'
import PhotoCardCarousel, { type PhotoCard } from '../sections/PhotoCardCarousel'
import StartupProgramDialog from './StartupProgramDialog'

const PROGRAM_CARDS: readonly PhotoCard[] = [
  {
    image: '/partners/ton.avif',
    title: 'Open source partners',
    description: 'Build and maintain open-source projects that extend the Oxy ecosystem, from SDKs and integrations to self-hosted deployments.',
    link: { label: 'Become an open source partner', href: '#become-a-partner' },
  },
  {
    image: '/partners/alejandra.avif',
    title: 'Community partners',
    description: 'Grow vibrant communities on top of the Oxy stack and help champion ethical, privacy-first technology around the world.',
    link: { label: 'Become a community partner', href: '#become-a-partner' },
  },
  {
    image: '/partners/desiree.avif',
    title: 'Education partners',
    description: 'Bring open-source tools, digital literacy, and the Oxy ecosystem into classrooms, workshops, and university programs.',
    link: { label: 'Become an education partner', href: '#become-a-partner' },
  },
  {
    visual: (
      <div className="flex size-full items-center justify-center bg-[color-mix(in_srgb,var(--tertiary)_24%,var(--background))] text-primary-text">
        <RocketLaunch size={96} weight="duotone" aria-hidden="true" />
      </div>
    ),
    title: 'Startup Program',
    description: 'A focused path for early teams building useful products on open, people-first infrastructure.',
    link: { label: 'Apply to the Startup Program', href: '#startup-program' },
  },
]

export default function PartnerProgramsGrid() {
  const startupProgramControl = useDialogControl()

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash !== '#startup-program') return
      window.requestAnimationFrame(() => startupProgramControl.open())
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [startupProgramControl])

  return (
    <>
      <PhotoCardCarousel
        id="programs"
        title="Four ways to partner."
        description="Pick the program that matches how you build, ship, teach, or grow an early team."
        cards={PROGRAM_CARDS}
        variant="square"
      />
      <StartupProgramDialog control={startupProgramControl} />
    </>
  )
}
