interface ResearchFeature {
  image: string
  title: string
  description: string
}

const RESEARCH_FEATURES: ResearchFeature[] = [
  {
    image: '/ai/research/oxy-ai-models.webp',
    title: 'Oxy AI, built for better answers',
    description:
      'Oxy AI brings capable models and transparent research tools together, so people can explore ideas with more context and control.',
  },
  {
    image: '/ai/research/oxy-open-source.webp',
    title: 'Open by design',
    description:
      'Oxy keeps the foundation visible. Open source code and transparent systems make it easier to inspect, improve, and trust the tools you use.',
  },
  {
    image: '/ai/research/oxy-ecosystem.webp',
    title: 'One ecosystem, many ways to connect',
    description:
      'Mention, Allo, Inbox, FairCoin, Homiio, and Alia are different products with a shared foundation: identity that belongs to people.',
  },
  {
    image: '/ai/research/oxy-human.webp',
    title: 'Technology that stays human',
    description:
      'We build for everyday life, work, and community without ads, data selling, or hidden incentives.',
  },
]

export default function AIResearchFeatureGrid() {
  return (
    <section className="bg-background text-foreground">
      <div className="container">
        <div className="py-10 md:py-14 lg:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mx-auto max-w-4xl text-balance text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
              Technology with people at the center
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              Open tools, shared identity, and responsible technology you can understand and control.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:mt-10 lg:grid-cols-4">
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
