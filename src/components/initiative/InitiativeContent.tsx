import { closingSection, engagementSection, introSection, pillarsSection } from '../../data/initiative'
import CardGrid from '../slices/CardGrid'
import CtaBlock from '../slices/CtaBlock'
import type { CardItem } from '../slices/InfoCard'
import PageHero from '../slices/PageHero'

/** The four pillars, as cards: the emoji is the mark, the number is the label. */
const pillarCards: CardItem[] = pillarsSection.pillars.map((pillar) => ({
  icon: <span className="text-3xl">{pillar.emoji}</span>,
  title: pillar.title,
  body: pillar.description,
}))

const pathwayCards: CardItem[] = engagementSection.pathways.map((pathway) => ({
  title: pathway.title,
  body: pathway.description,
  link: { label: pathway.ctaText, href: pathway.ctaHref, external: pathway.ctaHref.startsWith('http') },
}))

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

      <CardGrid
        title={pillarsSection.heading}
        description={pillarsSection.subtitle}
        cards={pillarCards}
        cardHeightClassName="min-h-50 lg:min-h-70"
      />

      <div id="get-involved" className="scroll-mt-24">
        <CardGrid
          title={engagementSection.heading}
          cards={pathwayCards}
          columnsClassName="md:grid-cols-2 xl:grid-cols-4"
          cardHeightClassName="min-h-50 lg:min-h-70"
        />
      </div>

      <CtaBlock
        title={closingSection.heading}
        body={closingSection.body}
        emphasis="supporting"
        action={{ label: 'Explore the ecosystem', href: '/apps' }}
      />
    </>
  )
}
