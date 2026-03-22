import { hero } from '../../data/content'
import Container from '../layout/Container'
import Button from '../ui/Button'

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100svh-var(--site-header-height))] flex-col bg-gradient-to-b from-[var(--color-primary-bg)] to-[var(--color-secondary-bg)]">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-blue-500)]/[0.07] blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col">
        <header className="flex w-full flex-col items-center pt-20 pb-15 lg:pt-30 xl:pt-30">
          <h1
            className="text-heading-responsive-lg max-w-[15em] text-balance text-center animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            {hero.title}
          </h1>
          <p
            className="mt-4 max-w-xl text-balance text-center text-lg text-[var(--color-secondary-fg)] lg:text-xl animate-fade-in-up"
            style={{ animationDelay: '300ms' }}
          >
            {hero.subtitle}
          </p>
          <div
            className="mt-8 flex items-center gap-3 animate-fade-in-up"
            style={{ animationDelay: '400ms' }}
          >
            <Button variant="primary" size="md" href="#">
              Start for free
            </Button>
            <Button variant="outline" size="md" href="#">
              Talk to sales
            </Button>
          </div>
        </header>

        {/* Product screenshot placeholder */}
        <Container>
          <div
            className="animate-fade-in-up mx-auto max-w-4xl overflow-hidden rounded-xl border border-[var(--color-subtle-stroke)] bg-[var(--color-secondary-bg)]"
            style={{ animationDelay: '600ms' }}
          >
            <img
              src="/placeholder-hero.png"
              alt="Ask Oxy product interface"
              className="h-auto w-full object-cover"
              loading="eager"
              onError={(e) => {
                // Show gradient placeholder if image not found
                const target = e.currentTarget
                target.style.display = 'none'
                target.parentElement!.style.minHeight = '400px'
                target.parentElement!.style.background =
                  'linear-gradient(135deg, var(--color-black-100), var(--color-black-300))'
              }}
            />
          </div>
        </Container>
      </div>
    </section>
  )
}
