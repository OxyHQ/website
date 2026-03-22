import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function TeamSizeSection() {
  const ref = useScrollReveal()

  return (
    <section className="container">
      <div className="flex flex-col items-center overflow-hidden border-subtle-stroke border-x">
        <svg width="100%" height="1" className="text-subtle-stroke">
          <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>

        <div ref={ref} className="relative grid grid-cols-12 gap-y-15 py-20">
          {/* Dot pattern background */}
          <svg width="100%" height="100%" className="text-muted-strong-background absolute inset-0">
            <defs>
              <pattern id="team-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#team-dots)" />
          </svg>

          {/* Text */}
          <div className="relative col-[2/-2] flex max-w-md flex-col gap-y-3 md:col-[2/9] scroll-reveal">
            <h2 className="text-balance text-secondary-foreground text-heading-responsive-md">130+ team members.</h2>
            <p className="text-balance text-accent-foreground">Building from our HQ in London, and across Europe and the US.</p>
          </div>

          {/* Photo grid */}
          <div className="relative col-[2/-2] grid grid-cols-10 gap-2.5 md:gap-3 lg:grid-cols-10">
            {[
              { span: 'col-span-4 lg:col-span-3', aspect: 'h-40 md:h-48 lg:h-64 xl:h-80' },
              { span: 'col-span-6 lg:col-span-4', aspect: 'h-40 md:h-48 lg:h-64 xl:h-80' },
              { span: 'col-span-6 lg:col-span-3', aspect: 'h-40 md:h-48 lg:h-64 xl:h-80' },
            ].map((photo, i) => (
              <div
                key={i}
                className={`${photo.span} flex ${photo.aspect} w-full origin-center items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-white-300 to-white-500 border border-subtle-stroke scroll-reveal`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <img src={`/placeholder-team-${i + 1}.jpg`} alt="" className="size-full object-cover" loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
