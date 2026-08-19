interface ResearchFeature {
  image: string
  title: string
  description: string
}

const RESEARCH_FEATURES: ResearchFeature[] = [
  {
    image: '/ai/pro-left.avif',
    title: 'All the models, one accurate answer',
    description:
      'Choose the right model for the question. Oxy AI brings different capabilities together so every search can be answered with more context and clarity.',
  },
  {
    image: '/ai/cta-desktop-bg.png',
    title: 'See the source behind every answer',
    description:
      'Research should be easy to verify. Follow the evidence, understand the context, and keep control of the conclusions you draw.',
  },
  {
    image: '/ai/feature-integrations.png',
    title: 'Deep Research for a complete report',
    description:
      'Ask the bigger question. Oxy AI can connect the dots across your work and help turn a broad investigation into a clear next step.',
  },
]

/**
 * Compact research feature grid shared by the home page and the AI page.
 * `framed` keeps the existing composition API for callers that already own a
 * page frame, while the section itself remains full bleed.
 */
export default function AIResearchSection({ framed = true }: { framed?: boolean }) {
  return (
    <section className="bg-background text-foreground">
      <div className={framed ? 'container' : undefined}>
        <div className="mx-auto w-full max-w-[90rem] py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mx-auto max-w-4xl text-balance text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
              Engineered to get it right
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              The best models, the recent data, and a source behind every claim.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-12">
            {RESEARCH_FEATURES.map((feature) => (
              <article key={feature.title} className="flex min-w-0 flex-col gap-5 lg:gap-7">
                <div className="aspect-square w-full overflow-hidden rounded-2xl bg-foreground/[0.04]">
                  <img
                    src={feature.image}
                    alt=""
                    aria-hidden="true"
                    className="size-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                    loading="lazy"
                    width={800}
                    height={800}
                  />
                </div>
                <div className="flex w-full flex-col gap-3 px-1 lg:gap-4">
                  <h3 className="text-xl font-medium tracking-tight">{feature.title}</h3>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
