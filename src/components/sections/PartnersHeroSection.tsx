import { ArrowUpRight } from '@phosphor-icons/react'
import { usePage, type PageSection } from '../../api/hooks'
import Button from '../ui/Button'
import { AnimatedTitle } from '../ui/AnimatedTitle'

const DEFAULT_HERO_BADGE = 'Partner programs'
const DEFAULT_HERO_TITLE = 'Build the open, ethical web with us.'
const DEFAULT_HERO_SUBTITLE = 'Oxy is an open-source ecosystem for social, AI, identity, and everyday tools. We work with developers, communities, and educators who want to ship privacy-first products people can actually trust.'

function sectionValue(sections: PageSection[], type: string, key: 'heading' | 'subheading' | 'content', fallback: string): string {
  return sections.find((section) => section.type === type)?.[key] || fallback
}

export default function PartnersHeroSection() {
  const { data: pageData } = usePage('partners')
  const sections = pageData?.sections ?? []
  const heroBadge = sectionValue(sections, 'hero', 'content', DEFAULT_HERO_BADGE)
  const heroTitle = sectionValue(sections, 'hero', 'heading', DEFAULT_HERO_TITLE)
  const heroSubtitle = sectionValue(sections, 'hero', 'subheading', DEFAULT_HERO_SUBTITLE)

  return (
    <section className="relative flex w-full max-w-screen flex-col items-center justify-center overflow-x-clip bg-linear-to-b from-surface to-background">
      <div className="container">
        <div className="relative grid min-h-[calc(100vh-64px)] w-full justify-center gap-9 py-16 lg:grid-rows-[1fr_auto] lg:gap-12 lg:px-6 lg:py-18">
          <header className="relative z-10 flex flex-col items-center justify-end text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-primary-text">{heroBadge}</p>
            <AnimatedTitle as="h1" className="mt-6 max-w-[14ch] text-center text-title-md text-primary-text md:text-title-lg">
              {heroTitle}
            </AnimatedTitle>
            <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">{heroSubtitle}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <Button variant="primary" size="md" responsive href="#become-a-partner">Become a partner <ArrowUpRight size={17} aria-hidden="true" /></Button>
              <Button variant="outline" size="md" responsive href="#programs">Explore programs</Button>
            </div>
          </header>
          <div className="relative z-10 flex w-full items-start justify-center px-0 lg:px-0">
            <div className="relative aspect-[16/7] w-full max-w-5xl overflow-hidden rounded-3xl bg-surface">
              <img src="/images/landing/partnerships-banner.avif" alt="" aria-hidden="true" width={1600} height={700} loading="eager" decoding="async" className="size-full object-cover object-center" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,color-mix(in_srgb,var(--background)_55%,transparent)_100%)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
