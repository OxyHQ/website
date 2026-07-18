import Button from '../ui/Button'

const PARTNER_EMAIL = 'partners@oxy.so'

const VALUE_PROPS: readonly { title: string; description: string }[] = [
  {
    title: 'Tell us about your project',
    description:
      'Share what you’re building or teaching, who it serves, and which Oxy products you want to plug into.',
  },
  {
    title: 'We pick the right program',
    description:
      'Open source, community, or education: we’ll match you to the program (or combination) that fits.',
  },
  {
    title: 'You ship, we co-promote',
    description:
      'Engineering support, co-marketing across Oxy channels, and a direct line to the team building the stack.',
  },
]

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  )
}

export default function BecomeAPartnerSection() {
  const mailto = `mailto:${PARTNER_EMAIL}?subject=Partner%20application%20%E2%80%94%20%5Bproject%20name%5D&body=Hi%20Oxy%20team%2C%0A%0AWe%E2%80%99re%20%5Borg%20%2F%20community%20%2F%20project%5D%20and%20we%E2%80%99d%20like%20to%20partner%20on%3A%0A%0A%E2%80%A2%20Project%2Fcommunity%3A%20%0A%E2%80%A2%20Oxy%20products%20we%E2%80%99d%20use%3A%20%0A%E2%80%A2%20Who%20it%20serves%3A%20%0A%E2%80%A2%20Program%20we%E2%80%99re%20interested%20in%20(open%20source%20%2F%20community%20%2F%20education)%3A%20%0A%E2%80%A2%20Link%20to%20what%20we%E2%80%99ve%20already%20built%3A%20%0A%0AThanks%2C%0A%5BYour%20name%5D`

  return (
    <section id="become-a-partner" className="container scroll-mt-24">
      <div className="relative isolate">
        {/* Dot pattern background */}
        <svg
          width="100%"
          height="100%"
          aria-hidden="true"
          className="mask-t-to-50% absolute inset-0 text-muted"
        >
          <defs>
            <pattern
              id="become-a-partner-dots"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#become-a-partner-dots)" />
        </svg>

        <div className="relative z-10 grid grid-cols-12">
          <div className="col-[2/-2] flex flex-col items-center pb-20 pt-20 text-center max-xl:pb-16 max-xl:pt-16 max-lg:pb-12 max-lg:pt-12">
            <p className="mb-6 inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-foreground">
              Become a partner
            </p>
            <h2 className="max-w-[18em] text-balance text-heading-responsive-md">
              Tell us what you want to build, and we&rsquo;ll help you ship it.
            </h2>
            <p className="mt-4 max-w-xl text-balance text-lg text-muted-foreground lg:text-xl">
              Send a short note to our partnerships team. We read every application and reply within a few business days.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="md" responsive href={mailto}>
                Email partners@oxy.so
              </Button>
              <Button variant="outline" size="md" responsive href="/technologies">
                Explore what to build on
              </Button>
            </div>

            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClockIcon />
              Typical response time: 2–5 business days.
            </p>

            <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-3">
              {VALUE_PROPS.map((prop, i) => (
                <div
                  key={prop.title}
                  className="flex flex-col gap-2 bg-background p-5 text-start"
                >
                  <span className="text-overline text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{prop.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{prop.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
