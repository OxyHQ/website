import { closingSection, engagementSection, introSection, pillarsSection } from '../../data/initiative'
import { RiDropLine } from '@oxy.so/bloom/icons/RiDropLine'
import { RiHandHeartLine } from '@oxy.so/bloom/icons/RiHandHeartLine'
import { RiShakeHandsLine } from '@oxy.so/bloom/icons/RiShakeHandsLine'
import { RiHeartLine } from '@oxy.so/bloom/icons/RiHeartLine'
import { RiLightbulbLine } from '@oxy.so/bloom/icons/RiLightbulbLine'
import { RiPlantLine } from '@oxy.so/bloom/icons/RiPlantLine'
import { RiTeamLine } from '@oxy.so/bloom/icons/RiTeamLine'
import { RiFloodLine } from '@oxy.so/bloom/icons/RiFloodLine'
import PhotoCardCarousel, { type PhotoCard } from '../sections/PhotoCardCarousel'
import CtaBlock from '../slices/CtaBlock'
import PageHero from '../slices/PageHero'

const pillarVisuals = [RiShakeHandsLine, RiPlantLine, RiDropLine, RiFloodLine]

/** The four pillars, rendered through the same visual card carousel as Home. */
const pillarCards: PhotoCard[] = pillarsSection.pillars.map((pillar, index) => {
  const Icon = pillarVisuals[index]
  return {
    visual: <Icon width={64} height={64} fill="currentColor" aria-hidden />,
    title: pillar.title,
    description: pillar.description,
  }
})

const pathwayVisuals = {
  idea: RiLightbulbLine,
  volunteer: RiHandHeartLine,
  donate: RiHeartLine,
  community: RiTeamLine,
} as const

const pathwayCards: PhotoCard[] = engagementSection.pathways.map((pathway) => {
  const Icon = pathwayVisuals[pathway.iconType]
  return {
    visual: <Icon width={64} height={64} fill="currentColor" aria-hidden />,
    title: pathway.title,
    description: pathway.description,
    link: { label: pathway.ctaText, href: pathway.ctaHref, external: pathway.ctaHref.startsWith('http') },
  }
})

export default function InitiativeContent() {
  return (
    <>
      <PageHero
        eyebrow="Oxy Initiative"
        title={introSection.tagline}
        tagline="Turning visionary ideas into reality."
        lede={introSection.description}
        action={{ label: 'Get involved', href: '#get-involved' }}
      />

      <nav className="layout-px-large pt-12 lg:pt-16 flex flex-wrap gap-x-6 gap-y-3">
        {introSection.navLinks.map((link) => (
          <a key={link.label} className="text-b1 text-alt-gray-e1 hover:text-gray-a1 transition-colors duration-200 ease-impulse" href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <PhotoCardCarousel
        id="who-we-are"
        title={pillarsSection.heading}
        description={pillarsSection.subtitle}
        cards={pillarCards}
      />

      <div id="get-involved" className="scroll-mt-24">
        <PhotoCardCarousel
          title={engagementSection.heading}
          cards={pathwayCards}
        />
      </div>

      <div id="explore" className="scroll-mt-24">
        <CtaBlock
          title={closingSection.heading}
          body={closingSection.body}
          emphasis="supporting"
          action={{ label: 'Explore the ecosystem', href: '/apps' }}
        />
      </div>
    </>
  )
}
