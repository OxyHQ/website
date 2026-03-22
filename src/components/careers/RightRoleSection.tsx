import Button from '../ui/Button'

export default function RightRoleSection() {
  return (
    <section className="w-full bg-white-200">
      <div className="container">
        <div className="flex flex-col border-subtle-stroke border-x">
          {/* Top decoration */}
          <div className="relative grid grid-cols-12 overflow-hidden border-subtle-stroke border-b max-lg:hidden">
            <svg width="1" height="100%" className="text-subtle-stroke relative col-2 h-8 max-xl:hidden">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            <div className="col-[8/-2] flex h-8 justify-between max-lg:*:hidden">
              <svg width="1" height="100%" className="text-subtle-stroke">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeLinecap="round" />
              </svg>
              <svg width="1" height="100%" className="text-subtle-stroke">
                <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-12">
            <div className="col-[2/8] grid grid-cols-6 flex-col justify-center gap-y-7 py-24 max-lg:col-[2/-2]">
              <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-start col-[1/-2]">
                <h2 className="text-pretty inline">Right role, right time.</h2>{' '}
                <p className="inline text-pretty font-medium text-black-800">
                  We'll share relevant opportunities when they open up.
                </p>
              </div>

              {/* Email form */}
              <div className="col-span-full grid min-h-16 w-full max-w-sm items-start md:grid-cols-[1fr_min-content] gap-2">
                <input
                  className="block w-full rounded-[10px] bg-primary-background p-[10px_13px] outline-hidden transition-all duration-300 ease-out text-secondary-foreground placeholder:text-accent-foreground border border-default-stroke hover:border-greyscale-light-08 hover:shadow-[0px_1px_4px_rgba(56,62,71,0.1)] focus:border-blue-500 focus:ring-[3px] focus:ring-blue-300 placeholder:max-w-full placeholder:text-base placeholder-shown:truncate h-10!"
                  type="email"
                  placeholder="Your email address"
                />
                <Button variant="primary" size="md" className="h-10!">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
