export default function CulturePhotosSection() {
  return (
    <section className="relative">
      <div className="container">
        <div className="grid grid-cols-12 lg:relative lg:border-subtle-stroke lg:border-x">
          {/* Top dashed horizontal line */}
          <svg width="100%" height="1" className="text-subtle-stroke absolute inset-x-0 top-19">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>
          {/* Bottom dashed horizontal line */}
          <svg width="100%" height="1" className="text-subtle-stroke absolute inset-x-0 bottom-19">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>

          <div className="relative col-[2/-2] p-1 py-20 max-lg:col-span-full">
            {/* Left dashed vertical line */}
            <svg width="1" height="100%" className="text-subtle-stroke absolute inset-y-0 left-0">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            {/* Right dashed vertical line */}
            <svg width="1" height="100%" className="text-subtle-stroke absolute inset-y-0 right-0">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>

            {/* Photo grid: 3 columns of gradient placeholder boxes */}
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/3] rounded-xl bg-gradient-to-br from-white-300 to-white-500 border border-subtle-stroke overflow-hidden"
                >
                  <img
                    src={`/placeholder-culture-${i}.jpg`}
                    alt=""
                    className="h-full w-full object-cover"
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
      </div>
    </section>
  )
}
