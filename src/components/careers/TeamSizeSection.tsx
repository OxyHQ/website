const photos = [
  {
    span: 'col-span-4 lg:col-span-3',
    src: '/placeholder-team-1.jpg',
    gradient: 'from-muted to-border',
  },
  {
    span: 'col-span-6 lg:col-span-4',
    src: '/placeholder-team-2.jpg',
    gradient: 'from-surface to-muted',
  },
  {
    span: 'col-span-6 lg:col-span-3',
    src: '/placeholder-team-3.jpg',
    gradient: 'from-muted to-border',
  },
  {
    span: 'col-span-4 lg:col-span-4',
    src: '/placeholder-team-4.jpg',
    gradient: 'from-surface to-muted',
  },
]

export default function TeamSizeSection() {
  return (
    <section className="container">
      <div className="flex flex-col items-center overflow-hidden border-border border-x">
        <svg width="100%" height="1" className="text-border">
          <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>

        <div className="relative grid grid-cols-12 gap-y-15 py-20">
          {/* Dot pattern background */}
          <svg width="100%" height="100%" className="text-muted absolute inset-0">
            <defs>
              <pattern id="team-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#team-dots)" />
          </svg>

          <div className="relative col-[2/-2] flex max-w-md flex-col gap-y-3 md:col-[2/9]">
            <h2 className="text-balance text-foreground">130+ team members.</h2>
            <p className="text-balance text-muted-foreground">Building from our HQ in London, and across Europe and the US.</p>
          </div>

          <div className="relative col-[2/-2] grid grid-cols-10 gap-2.5 md:gap-3 lg:grid-cols-10">
            {photos.map((photo, i) => (
              <div
                key={i}
                className={`${photo.span} flex h-40 w-full origin-center items-center justify-center overflow-hidden rounded-xl object-cover md:h-48 lg:h-64 xl:h-80`}
                style={{ filter: 'blur(0px)', opacity: 1, transform: 'none' }}
              >
                <div className={`size-full bg-gradient-to-br ${photo.gradient} absolute inset-0`} />
                <img
                  src={photo.src}
                  alt=""
                  className="size-full object-cover relative"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
