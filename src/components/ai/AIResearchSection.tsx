import Button from '../ui/Button'
import {
  researchHeading, researchParagraph, researchHighlight,
  researchCta, researchCtaHref,
} from '../../data/ai'

/**
 * Reusable "AI for Research" section.
 * Renders as a `<div>` (not `<section>`) so it can be composed
 * inside a parent `<section>` wrapper with additional effects.
 *
 * It brings its own page frame by default. Pass `framed={false}` when the
 * caller already provides one: a `container` inside a `container` applies the
 * gutter twice and pushes the block a full gutter inside every other section.
 */
export default function AIResearchSection({ framed = true }: { framed?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="grid min-h-[420px] grid-cols-[clamp(56px,12vw,360px)_minmax(0,1fr)_clamp(56px,12vw,360px)] items-center justify-center gap-4 py-6 lg:min-h-[480px] lg:grid-cols-[360px_minmax(0,40%)_360px]">
        <div className="flex h-full min-w-0 items-center justify-end overflow-hidden">
          <img
            src="/ai/pro-left.avif"
            alt="AI research visualization"
            className="pointer-events-none aspect-[3/4] w-[360px] max-w-none shrink-0 object-contain"
            loading="lazy"
            width={360}
            height={480}
          />
        </div>

        <div className="flex min-w-0 w-full justify-center">
          <div className={`flex w-full flex-col items-center space-y-8 text-center ${framed ? 'max-w-[560px]' : 'max-w-[640px]'}`}>
            <h2 className="text-foreground text-balance text-3xl tracking-tight md:text-4xl lg:text-5xl">{researchHeading}</h2>

            <p className="text-justify text-muted-foreground text-lg sm:text-xl">
              {researchParagraph.split('{highlight}')[0]}
              <span className="text-foreground font-medium">{researchHighlight}</span>
              {researchParagraph.split('{highlight}')[1]}
            </p>

            <Button variant="outline" size="md" href={researchCtaHref}>
              {researchCta}
            </Button>
          </div>
        </div>

        <div className="flex h-full min-w-0 items-center justify-start overflow-hidden">
          <img
            src="/ai/pro-right.avif"
            alt="AI research visualization"
            className="pointer-events-none aspect-[3/4] w-[360px] max-w-none shrink-0 object-contain"
            loading="lazy"
            width={360}
            height={480}
          />
        </div>
      </div>
    </div>
  )
}
