import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

function DashedLine({ solid = false }: { solid?: boolean }) {
  return (
    <svg width="100%" height="1" className="text-subtle-stroke col-span-full">
      <line
        x1="0"
        y1="0.5"
        x2="100%"
        y2="0.5"
        stroke="currentColor"
        {...(!solid && { strokeDasharray: '4 6', strokeLinecap: 'round' as const })}
        {...(solid && { strokeLinecap: 'round' as const })}
      />
    </svg>
  )
}

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main className="flex-1">
        <div className="container border-x border-subtle-stroke">
          <div className="flex h-full flex-col pt-[var(--site-header-height)]">
            <div className="grid grid-cols-12 overflow-hidden">
              {/* Status line */}
              <div className="col-[2/-2] py-5">
                <p className="text-overline">/ Status: 404</p>
              </div>

              <DashedLine />

              {/* Main heading */}
              <div className="col-[2/-2] pt-20 pb-15 lg:pt-30 lg:pb-20">
                <h1 className="text-heading-responsive-lg">Page not found.</h1>
                <p className="pt-6 text-secondary-foreground lg:text-xl">
                  This page does not exist.
                </p>
              </div>

              <DashedLine solid />

              {/* CTA section */}
              <div className="col-[2/-2] py-15 lg:py-20">
                <p className="max-w-xs text-balance text-secondary-foreground">
                  Oxy is AI-native data infrastructure
                  <br className="max-xs:hidden" />
                  for the modern enterprise.
                </p>
                <p className="max-w-md text-pretty pt-5 text-tertiary-foreground">
                  <Link
                    to="/"
                    className="underline decoration-2 decoration-white-500 underline-offset-2 transition-all duration-700 hover:brightness-75 hover:duration-300 active:brightness-50 active:duration-0"
                  >
                    Go to homepage
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
