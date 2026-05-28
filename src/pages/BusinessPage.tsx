import { Suspense, createElement } from 'react'
import { MDXProvider } from '@mdx-js/react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import PageSection from '../components/layout/PageSection'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useCurrentLocale } from '../lib/i18n'
import { loadCompanyPage } from '../content/company-loader'
import { mdxContentComponents } from '../content/_components'

/* ──────────────────────────────────────────────
 * /company/business
 *
 * Prose surface backed by `src/content/company/business.mdx`. Hero CTAs are
 * static; the body is fully MDX so writers can iterate without touching code.
 * ──────────────────────────────────────────── */

export default function BusinessPage() {
  const locale = useCurrentLocale()
  const entry = loadCompanyPage('business', locale)

  if (!entry) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Business copy missing — see <code>src/content/company/business.mdx</code>.
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  const { frontmatter, Component } = entry

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={frontmatter.title}
        description={frontmatter.description}
        canonicalPath="/company/business"
        ogImage={frontmatter.ogImage}
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="relative">
          <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 pt-32 pb-20 text-center lg:px-8 lg:pt-40 lg:pb-28">
            {frontmatter.eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {frontmatter.eyebrow}
              </p>
            ) : null}
            <h1 className="text-balance text-heading-responsive-lg text-foreground">
              {frontmatter.title}
            </h1>
            <p className="max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground md:text-xl">
              {frontmatter.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary" size="md" responsive href="/company/transparency">
                Transparency Center
              </Button>
              <Button variant="outline" size="md" responsive href="/partners">
                Partner programs
              </Button>
            </div>
          </div>
        </section>

        {/* ═══ Body (MDX) ═══ */}
        <PageSection spacing="md" width="narrow">
          <article className="text-foreground">
            <MDXProvider components={mdxContentComponents}>
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
                {createElement(Component)}
              </Suspense>
            </MDXProvider>
          </article>
        </PageSection>

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
