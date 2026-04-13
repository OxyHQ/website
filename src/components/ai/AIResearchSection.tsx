import Button from '../ui/Button'
import {
  researchHeading, researchParagraphs, researchHighlight,
  researchCta, researchCtaHref,
} from '../../data/ai'

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  )
}

export default function AIResearchSection() {
  return (
    <section className="py-16 sm:py-32 relative overflow-hidden">
      <div className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
        <div className="relative flex items-center justify-center py-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-center">
          {/* Left image */}
          <img src="/ai/pro-left.avif" alt="" className="pointer-events-none hidden lg:block w-full" />

          {/* Center content */}
          <div className="relative flex flex-col items-center space-y-8 text-center">
            <h2 className="text-foreground text-balance text-3xl tracking-tight md:text-4xl lg:text-5xl">{researchHeading}</h2>

            <p className="text-muted-foreground text-lg sm:text-xl">
              {researchParagraphs[0]}
            </p>
            <p className="text-muted-foreground text-lg sm:text-xl">
              {researchParagraphs[1].split('{highlight}')[0]}<span className="text-foreground font-medium">{researchHighlight}</span>{researchParagraphs[1].split('{highlight}')[1]}
            </p>

            <Button variant="outline" size="md" href={researchCtaHref}>
              {researchCta} <ArrowUpRightIcon className="size-4" />
            </Button>
          </div>

          {/* Right image */}
          <img src="/ai/pro-right.avif" alt="" className="pointer-events-none hidden lg:block w-full" />
        </div>
      </div>
    </section>
  )
}
