import Button from '../ui/Button'
import {
  researchHeading, researchParagraphs, researchHighlight,
  researchCta, researchCtaHref,
} from '../../data/ai'

/**
 * Reusable "AI for Research" section.
 * Renders as a `<div>` (not `<section>`) so it can be composed
 * inside a parent `<section>` wrapper with additional effects.
 */
export default function AIResearchSection() {
  return (
    <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
      <div className="relative flex items-center justify-center py-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-center">
        <img
          src="/ai/pro-left.avif"
          alt="AI research visualization"
          className="pointer-events-none hidden lg:block w-full"
          loading="lazy"
          width={360}
          height={480}
        />

        <div className="relative flex flex-col items-center space-y-8 text-center">
          <h2 className="text-foreground text-balance text-3xl tracking-tight md:text-4xl lg:text-5xl">{researchHeading}</h2>

          <p className="text-muted-foreground text-lg sm:text-xl">
            {researchParagraphs[0]}
          </p>
          <p className="text-muted-foreground text-lg sm:text-xl">
            {researchParagraphs[1].split('{highlight}')[0]}
            <span className="text-foreground font-medium">{researchHighlight}</span>
            {researchParagraphs[1].split('{highlight}')[1]}
          </p>

          <Button variant="outline" size="md" href={researchCtaHref}>
            {researchCta}
          </Button>
        </div>

        <img
          src="/ai/pro-right.avif"
          alt="AI research visualization"
          className="pointer-events-none hidden lg:block w-full"
          loading="lazy"
          width={360}
          height={480}
        />
      </div>
    </div>
  )
}
