const logos = ['Cisco', 'Scale', 'Notion', 'Cognition', 'Anduril']

const features = [
  {
    title: 'Built to drive real engineering work',
    description: 'Codea reads your codebase, understands context, and writes production-ready code that fits your architecture and style.',
  },
  {
    title: 'Parallel task execution',
    description: 'Run multiple tasks simultaneously in isolated cloud sandboxes. Each task gets its own environment to write, test, and iterate independently.',
  },
  {
    title: 'Context-aware code generation',
    description: 'Codea indexes your entire repository, understands dependencies, and generates code that integrates seamlessly with your existing patterns.',
  },
]

const platforms = [
  { title: 'Start in the Codea app', description: 'Use the full-featured web interface to manage tasks, review diffs, and collaborate with your team in real time.' },
  { title: 'Launch from CLI', description: 'Run Codea directly from your terminal. Kick off tasks, check progress, and merge results without leaving your workflow.' },
  { title: 'Build with the API', description: 'Integrate Codea into your CI/CD pipeline, custom tooling, or internal platforms with our developer-friendly API.' },
]

const testimonials = [
  { name: 'Sarah Chen', role: 'Staff Engineer at Vercel', quote: 'Codea completely changed how our team handles large refactors. What used to take weeks now takes hours.' },
  { name: 'Marcus Johnson', role: 'CTO at Replay', quote: 'The parallel execution is a game changer. We run 10 tasks at once and review the results in one sitting.' },
  { name: 'Priya Sharma', role: 'Engineering Lead at Linear', quote: 'It actually understands our codebase. The suggestions feel like they come from someone who has been on the team for months.' },
  { name: 'Alex Rivera', role: 'Senior Developer at Stripe', quote: 'We integrated Codea into our CI pipeline and it catches bugs before they even reach code review. Incredible tool.' },
  { name: 'Emily Zhang', role: 'Founder at Basedash', quote: 'As a small team, Codea feels like having an extra senior engineer. It writes tests, fixes bugs, and ships features.' },
  { name: 'David Kim', role: 'VP Engineering at Notion', quote: 'The context awareness is unreal. It respects our conventions and patterns without any extra configuration.' },
]

export default function CodexExtensionContent() {
  return (
    <>
      {/* ── Hero Section ── */}
      <section className="bg-primary-background relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-gradient-to-b from-secondary-background to-primary-background" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-12 pb-12 text-center sm:pt-28 sm:pb-16 md:pb-24 lg:pt-16">
          {/* Icon */}
          <div className="flex h-[72px] w-[72px] items-center justify-center sm:h-[78px] sm:w-[78px] md:h-[92px] md:w-[92px]">
            <div className="relative overflow-hidden h-full w-full rounded-[20px] bg-secondary-background" />
          </div>
          <h1 className="text-heading-responsive-lg mt-6">
            Code with a<br />reasoning agent
          </h1>
          <p className="text-xl text-secondary-foreground mt-5 max-w-xl text-balance">
            Codea writes code, fixes bugs, and runs tests in parallel cloud sandboxes.
          </p>
          <div className="mt-8 flex gap-3">
            <a className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 h-10 rounded-full px-5 text-sm button-primary md:h-11 md:px-6" href="#">
              Try Codea
            </a>
            <a className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 h-10 rounded-full px-5 text-sm button-outline md:h-11 md:px-6" href="#">
              Download for Windows
            </a>
          </div>
        </div>
      </section>

      {/* ── Logo Garden ── */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pt-6 pb-10 text-center md:pt-12 md:pb-12">
        <div className="mt-6 w-full max-w-[1040px] md:mt-8">
          <div className="grid grid-cols-5 place-items-center gap-x-10 gap-y-8">
            {logos.map((name) => (
              <span key={name} className="flex h-14 w-full items-center justify-center md:h-16">
                <span className="text-tertiary-foreground text-sm opacity-60">{name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="mx-auto flex w-full flex-col items-center px-6 pt-20 pb-36 text-center md:px-16 md:pt-24 md:pb-40">
        <div className="text-heading-responsive-md">The best way to build with agents</div>
        <div className="mt-16 flex w-full flex-col gap-28 text-start md:mt-20 md:gap-36">
          {features.map((f, i) => (
            <div key={f.title} className="flex w-full flex-col items-center gap-14 md:flex-row md:items-end md:gap-8 lg:gap-20">
              <div className={`flex w-full flex-col items-start md:flex-[0_0_28%] md:justify-end ${i % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                <div className="text-heading-responsive-sm md:max-w-[340px]">{f.title}</div>
                <div className="text-lg text-secondary-foreground mt-5 md:max-w-[350px]">{f.description}</div>
              </div>
              <div className={`relative w-full md:max-w-none md:flex-[0_0_72%] lg:h-[520px] ${i % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}>
                <div className="h-full w-full rounded-lg bg-secondary-background aspect-video" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── The Same Agent Everywhere ── */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-24 text-center">
        <div className="text-heading-responsive-md md:text-[40px]">The same agent everywhere you code</div>
        <div className="text-lg text-secondary-foreground mt-5 max-w-3xl">
          Use Codea across multiple surfaces, all connected by your account.
        </div>
        <div className="mt-16 grid w-full grid-cols-1 gap-8 text-start md:mt-20 md:grid-cols-3">
          {platforms.map((p) => (
            <div key={p.title} className="bg-secondary-background/75 flex h-full flex-col overflow-hidden rounded-md p-4 shadow md:p-5">
              <div className="relative -mx-2 -mt-2 w-auto overflow-hidden rounded-lg md:-mx-[10px] md:-mt-[10px] bg-secondary-background aspect-video" />
              <div className="text-lg font-semibold mt-4">{p.title}</div>
              <p className="text-sm text-tertiary-foreground mt-2">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="flex w-full flex-col items-center text-center">
        <h2 className="text-heading-responsive-md text-balance px-4">What builders are saying</h2>
        <div className="mt-12 grid w-full grid-cols-1 gap-6 px-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-secondary-background flex flex-col justify-between rounded-lg p-6">
              <p className="text-primary-foreground text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-background" />
                <div>
                  <div className="text-primary-foreground text-sm font-medium">{t.name}</div>
                  <div className="text-tertiary-foreground text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-secondary-background to-primary-background" />
        <div className="relative z-10 mx-auto flex w-full max-w-none flex-col items-center justify-between gap-6 px-6 py-20 md:px-10 md:py-24 lg:px-14">
          <div className="text-heading-responsive-md text-primary-foreground">Try Codea today</div>
          <p className="text-lg text-secondary-foreground max-w-4xl text-center text-balance">
            Try with Free and Go, or enjoy 2x rate limits on all plans.
          </p>
          <a className="relative inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 h-11 rounded-full px-6 text-base button-outline" href="#">
            Download for Windows
          </a>
        </div>
      </section>
    </>
  )
}
