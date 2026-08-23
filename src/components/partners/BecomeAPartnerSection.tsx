import { ArrowUpRight, BookOpenText, Code, HandHeart, UsersThree } from '@phosphor-icons/react'
import Button from '../ui/Button'
import { AnimatedTitle } from '../ui/AnimatedTitle'

const PARTNER_EMAIL = 'partners@oxy.so'

const VALUE_PROPS = [
  { title: 'Tell us what you are building', description: 'Share who it serves and which Oxy products you want to connect.', icon: Code },
  { title: 'Find the right path', description: 'We match your project to an existing program or shape a new one.', icon: UsersThree },
  { title: 'Ship with support', description: 'Get technical guidance, credits, and a direct line to the team.', icon: HandHeart },
] as const

export default function BecomeAPartnerSection() {
  const mailto = `mailto:${PARTNER_EMAIL}?subject=Partner%20application&body=Hi%20Oxy%20team%2C%0A%0AWe%27d%20like%20to%20partner%20on%3A%0A%0AProject%3A%20%0AOxy%20products%3A%20%0ALink%3A%20%0A%0AThanks%2C%0A`

  return (
    <section id="become-a-partner" className="relative isolate overflow-hidden text-foreground">
      <img src="/images/landing/team-banner.jpg" alt="" aria-hidden="true" width={1920} height={860} loading="lazy" decoding="async" className="absolute inset-0 -z-20 size-full object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-background/80" />
      <div className="container">
        <div className="grid items-start gap-6 py-10 min-[951px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] min-[951px]:gap-10 min-[951px]:py-14">
          <div>
            <AnimatedTitle static as="h2" className="mb-4 text-heading-responsive-lg text-primary-text">Bring your next idea into the open.</AnimatedTitle>
            <p className="max-w-[500px] text-base leading-relaxed text-foreground/75 md:text-lg">Tell us what you want to build, and we will help you find the people, tools, and path to ship it.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button variant="primary" size="md" responsive href={mailto}>Email partners@oxy.so <ArrowUpRight size={17} aria-hidden="true" /></Button>
              <Button variant="outline" size="md" responsive href="/apps">Explore the ecosystem</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-x-6 gap-y-2 max-[650px]:grid-cols-1">
            {VALUE_PROPS.map(({ title, description, icon: Icon }) => (
              <div key={title} className="flex min-h-16 items-start gap-3 px-1 py-2 text-sm leading-snug text-foreground/90">
                <Icon size={20} weight="regular" className="mt-0.5 shrink-0 text-primary-text" aria-hidden="true" />
                <span><strong className="font-semibold text-primary-text">{title}</strong><span className="mt-1 block text-foreground/70">{description}</span></span>
              </div>
            ))}
            <div className="flex min-h-16 items-start gap-3 px-1 py-2 text-sm leading-snug text-foreground/90">
              <BookOpenText size={20} weight="regular" className="mt-0.5 shrink-0 text-primary-text" aria-hidden="true" />
              <span><strong className="font-semibold text-primary-text">Typical response</strong><span className="mt-1 block text-foreground/70">We reply within 2–5 business days.</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
