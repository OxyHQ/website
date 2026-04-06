import { introSection } from '../../data/initiative'
import Button from '../ui/Button'

export default function IntroSection() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6">
      <div className="border-x border-border">
        <header className="grid grid-cols-12 justify-items-center pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15">
          <div className="col-[2/-2] flex flex-col items-center gap-4 text-center">
            <h2 className="text-heading-responsive-lg">{introSection.tagline}</h2>
            <p className="mt-4 max-w-xl text-balance text-center text-lg text-muted-foreground lg:text-xl">
              {introSection.description}
            </p>
          </div>
        </header>
        <div className="grid grid-cols-12">
          <nav className="col-[2/-2] flex flex-wrap items-center justify-center gap-3 pb-20">
            {introSection.navLinks.map((link) => (
              <Button key={link.label} variant="outline" size="md" responsive href={link.href}>
                {link.label}
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}
