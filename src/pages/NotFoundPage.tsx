import { useMemo } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import { isFairCoinHost } from '../lib/host'
import { fc } from '../lib/faircoin-links'
import {
  useFairCoinFooterBrand,
  useFairCoinFooterColumns,
  useFairCoinFooterCopyright,
  useFairCoinFooterLegalLinks,
  useFairCoinNavCtaButtons,
  useFairCoinNavItems,
  useFairCoinNavbarBrand,
} from '../lib/faircoin-chrome'

export default function NotFoundPage() {
  const onFairCoinHost = isFairCoinHost()
  const homeHref = useMemo(() => fc('/'), [])
  const navbarBrand = useFairCoinNavbarBrand()
  const navItems = useFairCoinNavItems()
  const ctaButtons = useFairCoinNavCtaButtons()
  const footerBrand = useFairCoinFooterBrand()
  const footerColumns = useFairCoinFooterColumns()
  const footerLegalLinks = useFairCoinFooterLegalLinks()
  const footerCopyright = useFairCoinFooterCopyright()

  return (
    <div className={`flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background ${onFairCoinHost ? 'faircoin-theme' : ''}`}>
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
        canonicalPath="/404"
        noIndex
      />
      {onFairCoinHost ? (
        <Navbar
          brand={navbarBrand}
          navItems={navItems}
          ctaButtons={ctaButtons}
          hideAuth
          hideBanner
          hideLocalePicker
        />
      ) : (
        <Navbar />
      )}
      <main className="flex flex-1 items-center pt-[var(--site-header-height)]">
        <div className="container border-x border-border">
          <div className="grid grid-cols-12 items-center py-12 lg:py-16">
            {/* Text */}
            <div className="col-span-full flex flex-col items-center text-center lg:col-[2/8] lg:items-start lg:text-left">
              <p className="text-overline text-muted-foreground">/ Status: 404</p>
              <h1 className="mt-3 text-heading-responsive-lg">Page not found.</h1>
              <p className="mt-3 max-w-sm text-pretty text-muted-foreground">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
                <Button variant="primary" size="md" href={homeHref}>
                  Go to homepage
                </Button>
                {onFairCoinHost ? (
                  <Button
                    variant="outline"
                    size="md"
                    href="https://explorer.fairco.in"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Explorer
                  </Button>
                ) : (
                  <Button variant="outline" size="md" href="/help">
                    Visit help center
                  </Button>
                )}
              </div>
            </div>

            {/* Illustration */}
            <div className="col-span-full mt-10 flex justify-center lg:col-[8/-2] lg:mt-0 lg:justify-end">
              <img
                src="/images/404.png"
                alt="Retro computer showing a 404 error"
                className="w-52 select-none lg:w-68 xl:w-80"
                loading="lazy"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </main>
      {onFairCoinHost ? (
        <Footer
          brand={footerBrand}
          columns={footerColumns}
          socialLinks={[]}
          legalLinks={footerLegalLinks}
          copyright={footerCopyright}
        />
      ) : (
        <Footer />
      )}
    </div>
  )
}
