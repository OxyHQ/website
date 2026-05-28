import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import PageSection from '../components/layout/PageSection'
import SectionHeading from '../components/layout/SectionHeading'
import Card from '../components/layout/Card'
import Button from '../components/ui/Button'
import { buildDocsHref, getPackages } from '../content/docs-loader'
import type { SyncedPackage } from '../../scripts/types'
import {
  heroEyebrow,
  heroTitle,
  heroDescription,
  heroPrimaryCta,
  heroSecondaryCta,
  sdkCategories,
  sdksHeading,
  sdksDescription,
  quickStartEyebrow,
  quickStartHeading,
  quickStartDescription,
  quickStartInstall,
  quickStartUsage,
  apiEyebrow,
  apiHeading,
  apiDescription,
  apiCta,
  resourcesHeading,
  resources,
  ctaHeading,
  ctaDescription,
} from '../data/developers'

/**
 * Canonical landing URL for a package card. Mirrors `pageHref` in
 * DocsIntroPage so both surfaces deep-link to the same package landing.
 */
function pageHref(pkg: SyncedPackage): string {
  return buildDocsHref(pkg, pkg.latestVersion, '')
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
      className={className}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  )
}

/* ─── Hero ─── */
function DevelopersHero() {
  return (
    <PageSection spacing="lg">
      <div className="flex max-w-3xl flex-col gap-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {heroEyebrow}
        </p>
        <h1 className="text-balance text-heading-responsive-lg text-foreground">
          {heroTitle}
        </h1>
        <p className="text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
          {heroDescription}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" href={heroPrimaryCta.href}>
            {heroPrimaryCta.label}
          </Button>
          <Button variant="outline" size="lg" href={heroSecondaryCta.href}>
            {heroSecondaryCta.label}
          </Button>
        </div>
      </div>
    </PageSection>
  )
}

/* ─── SDK grid grouped by category, driven by synced docs index ─── */
function SDKGrid({ packages }: { packages: SyncedPackage[] }) {
  const sections = sdkCategories
    .map((cfg) => ({
      ...cfg,
      items: packages.filter((p) => p.category === cfg.category),
    }))
    .filter((s) => s.items.length > 0)

  return (
    <PageSection spacing="md" tone="surface">
      <SectionHeading title={sdksHeading} description={sdksDescription} />
      <div className="mt-12 space-y-16">
        {sections.map((section) => (
          <div key={section.category}>
            <div className="mb-6 flex flex-col gap-1">
              <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((pkg) => (
                <Link
                  key={pkg.shortName}
                  to={pageHref(pkg)}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-background p-6 transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">
                      {pkg.displayName}
                    </span>
                    {pkg.versioned ? (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        v{pkg.latestVersion}
                      </span>
                    ) : null}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{pkg.package}</div>
                  {pkg.description ? (
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  ) : null}
                  <div className="mt-auto flex items-center gap-1.5 pt-2 text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Read docs <ArrowRightIcon className="size-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageSection>
  )
}

/* ─── Quick start ─── */
function QuickStart() {
  return (
    <PageSection spacing="md">
      <SectionHeading
        eyebrow={quickStartEyebrow}
        title={quickStartHeading}
        description={quickStartDescription}
      />
      <div className="mt-10 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Install
            </p>
            <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-foreground">
              <code>{quickStartInstall}</code>
            </pre>
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Use it
            </p>
            <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-foreground">
              <code>{quickStartUsage}</code>
            </pre>
          </div>
        </div>
      </div>
    </PageSection>
  )
}

/* ─── REST API promo ─── */
function APIPromo() {
  return (
    <PageSection spacing="md" tone="surface">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <SectionHeading eyebrow={apiEyebrow} title={apiHeading} description={apiDescription} />
        <div className="flex flex-col items-start gap-4 lg:items-end">
          <div className="w-full rounded-2xl border border-border bg-background p-6">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Example
            </p>
            <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-foreground">
              <code>{`curl https://api.oxy.so/users/me \\
  -H "Authorization: Bearer $OXY_TOKEN"`}</code>
            </pre>
          </div>
          <Button variant="primary" size="md" href={apiCta.href}>
            {apiCta.label} <ArrowRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </PageSection>
  )
}

/* ─── Resources grid ─── */
function Resources() {
  return (
    <PageSection spacing="md">
      <SectionHeading title={resourcesHeading} />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {resources.map((item) => {
          const external = Boolean(item.external)
          return (
            <Card
              key={item.title}
              variant="outline"
              href={item.href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="flex h-full flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-foreground">{item.title}</span>
                <ArrowRightIcon className="size-3.5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </Card>
          )
        })}
      </div>
    </PageSection>
  )
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <PageSection spacing="lg" tone="surface">
      <div className="flex flex-col items-center gap-6 text-center">
        <h2 className="text-balance text-heading-responsive-lg text-foreground">
          {ctaHeading}
        </h2>
        <p className="max-w-xl text-pretty text-lg text-muted-foreground">{ctaDescription}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="lg" href={heroPrimaryCta.href}>
            {heroPrimaryCta.label}
          </Button>
          <Button variant="outline" size="lg" href={heroSecondaryCta.href}>
            {heroSecondaryCta.label}
          </Button>
        </div>
      </div>
    </PageSection>
  )
}

export default function DevelopersPage() {
  const packages = getPackages()

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background text-foreground">
      <SEO
        title="Developers"
        description="Build on Oxy. TypeScript SDKs, React hooks, React Native components, and a fully documented REST API."
        canonicalPath="/developers"
      />
      <Navbar />
      <main className="flex-1">
        <DevelopersHero />
        <SDKGrid packages={packages} />
        <QuickStart />
        <APIPromo />
        <Resources />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
