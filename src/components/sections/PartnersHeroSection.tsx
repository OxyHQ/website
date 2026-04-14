import Button from '../ui/Button'
import { usePage, type PageSection } from '../../api/hooks'

// Fallback copy — used when the CMS `pages/partners` document is missing the
// hero section. Copy matches the pre-CMS markup exactly.
const DEFAULT_HERO_BADGE = 'Partner programs'
const DEFAULT_HERO_TITLE = 'Build the open, ethical web with us.'
const DEFAULT_HERO_SUBTITLE = 'Oxy is an open-source ecosystem for social, AI, identity, and everyday tools. We work with developers, communities, and educators who want to ship privacy-first products people can actually trust.'

function sectionHeading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.heading || fallback
}

function sectionSubheading(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.subheading || fallback
}

function sectionContent(sections: PageSection[], type: string, fallback: string): string {
  return sections.find(s => s.type === type)?.content || fallback
}

export default function PartnersHeroSection() {
  const { data: pageData } = usePage('partners')
  const sections = pageData?.sections ?? []
  const heroBadge = sectionContent(sections, 'hero', DEFAULT_HERO_BADGE)
  const heroTitle = sectionHeading(sections, 'hero', DEFAULT_HERO_TITLE)
  const heroSubtitle = sectionSubheading(sections, 'hero', DEFAULT_HERO_SUBTITLE)

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6">
      <div className="relative isolate border-x border-border">
        {/* Dot pattern background */}
        <svg
          width="100%"
          height="100%"
          className="mask-t-to-50% absolute inset-0 text-muted"
        >
          <defs>
            <pattern
              id="partners-hero-dots"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#partners-hero-dots)" />
        </svg>

        <div className="relative z-20 grid grid-cols-12">
          <div className="relative col-[2/-2]">
            <header className="flex w-full flex-col items-center pb-24 pt-30 max-xl:pt-25 max-lg:pt-20 lg:pb-28 xl:pb-32">
              {/* Badge */}
              <p className="mb-6 inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-foreground">
                {heroBadge}
              </p>

              {/* Title */}
              <h1 className="max-w-[15em] text-balance text-center text-heading-responsive-lg">
                {heroTitle}
              </h1>

              {/* Subtitle */}
              <p className="mt-4 max-w-2xl text-balance text-center text-lg text-foreground lg:text-xl">
                {heroSubtitle}
              </p>

              {/* CTAs */}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Button variant="primary" size="md" responsive href="#become-a-partner">
                  Become a partner
                </Button>
                <Button variant="outline" size="md" responsive href="/company">
                  Learn about Oxy
                </Button>
              </div>
            </header>
          </div>
        </div>
      </div>
    </div>
  )
}
