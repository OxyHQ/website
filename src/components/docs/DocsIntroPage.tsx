import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { useLottie } from 'lottie-react'
import docsHeroAnimation from '../../assets/lottie/docs-hero.json'
import { buildDocsHref, getPackages } from '../../content/docs-loader'
import type { SyncedPackage } from '../../../scripts/types'
import DocsSubNav from './DocsSubNav'
import { DocsPackageSidebar, buildSidebar } from './DocsPackageSidebar'
import { getPackageLogo } from './getPackageLogo'
import { AnimatedTitle } from '../ui/AnimatedTitle'
import { ArrowRightIcon } from '../icons'

interface CategoryConfig {
  category: SyncedPackage['category']
  title: string
  description: string
}

const categoryOrder: CategoryConfig[] = [
  { category: 'ui-library', title: 'UI Library', description: 'Cross-platform components and theming primitives.' },
  { category: 'sdk', title: 'SDKs', description: 'TypeScript clients, React hooks, and React Native components.' },
  { category: 'app', title: 'Apps', description: 'Guides for the Oxy product surface: accounts, inbox, console, auth.' },
  { category: 'service', title: 'Services', description: 'Backend services and REST APIs.' },
]

const categoryVisuals: Record<SyncedPackage['category'], { icon: string; hover: string }> = {
  'ui-library': {
    icon: 'bg-primary/15 text-primary',
    hover: 'hover:bg-primary/8',
  },
  sdk: {
    icon: 'bg-secondary/15 text-secondary-foreground',
    hover: 'hover:bg-secondary/10',
  },
  app: {
    icon: 'bg-tertiary/15 text-tertiary-foreground',
    hover: 'hover:bg-tertiary/10',
  },
  service: {
    icon: 'bg-primary/15 text-primary',
    hover: 'hover:bg-primary/8',
  },
}

/**
 * Canonical landing URL for a package card. Versioned packages link to
 * their latest version with no slug; non-versioned packages link straight
 * to the bare package URL (no version segment).
 */
function pageHref(pkg: SyncedPackage): string {
  return buildDocsHref(pkg, pkg.latestVersion, '')
}

/* ─── Main Component ─── */
export default function DocsIntroPage() {
  const packages = getPackages()
  const sections = buildSidebar()
  const reduceMotion = useReducedMotion()
  const { View: docsHeroAnimationView } = useLottie(
    {
      animationData: docsHeroAnimation,
      loop: !reduceMotion,
      autoplay: !reduceMotion,
      renderer: 'svg',
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    },
    { width: '100%', height: '100%' },
  )

  return (
    <div className="relative antialiased bg-[color-mix(in_srgb,var(--primary)_5%,var(--background))]">
      <DocsSubNav />

      {/* Sidebar (shared with detail pages) + Content */}
      <div className="flex w-full">
        <DocsPackageSidebar sections={sections} />

        {/* Main content */}
        <main className="relative grow box-border flex-col w-full min-w-0 bg-[color-mix(in_srgb,var(--primary)_5%,var(--background))] py-6">
          {/* Decorative background animation, bundled with the docs route so
              the hero has no runtime dependency on lottie.host. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-14 left-1/2 aspect-[652/470] w-full max-w-[652px] -translate-x-1/2"
            data-docs-hero-animation
          >
            <div className="size-full opacity-80" data-docs-hero-lottie>
              {docsHeroAnimationView}
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-[color-mix(in_srgb,var(--primary)_5%,var(--background))]"
              data-docs-hero-fade
            />
          </div>

          <div className="container relative z-10">
            {/* Hero content */}
            <div className="mx-auto w-full max-w-3xl py-12 lg:py-20 lg:pb-10">
              <AnimatedTitle as="h1" className="block text-heading-responsive-lg text-center font-semibold text-foreground">
                Documentation
              </AnimatedTitle>
              <div className="max-w-xl mx-auto px-4 mt-4 text-lg text-center text-muted-foreground">
                Everything you need to build on the Oxy platform: open source, no vendor lock-in.
              </div>

            </div>

            {/* Category sections */}
            <div className="w-full space-y-8 pb-14">
              {categoryOrder.map((cfg) => {
                const pkgs = packages.filter((p) => p.category === cfg.category)
                if (pkgs.length === 0) return null
                const visual = categoryVisuals[cfg.category]
                return (
                  <section key={cfg.category} className="grid gap-4 xl:grid-cols-[minmax(0,13rem)_1fr] xl:gap-8">
                    <div className="sticky top-[calc(var(--site-header-occlusion-bottom)+0.5rem)] z-10 -mx-2 self-start rounded-xl bg-[color-mix(in_srgb,var(--primary)_5%,var(--background))] px-2 py-2 lg:top-[calc(var(--site-header-occlusion-bottom)+3.5rem)] xl:mx-0 xl:px-0 xl:py-3">
                      <h2 className="text-2xl font-semibold tracking-tight text-primary">{cfg.title}</h2>
                      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{cfg.description}</p>
                    </div>
                  <div className="grid self-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {pkgs.map((pkg) => {
                      const logo = getPackageLogo(pkg.shortName)
                      return (
                        <Link
                          key={pkg.shortName}
                          to={pageHref(pkg)}
                          className={`group grid min-h-[84px] grid-cols-[2.25rem_minmax(0,1fr)_1.5rem] items-center gap-x-2 overflow-hidden rounded-2xl bg-card px-2.5 py-2.5 text-card-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${visual.hover}`}
                          data-docs-package-card
                        >
                          {logo ? (
                            <span
                              aria-hidden="true"
                              className="size-9 shrink-0 overflow-hidden rounded-full"
                              data-docs-package-logo
                            >
                              <img src={logo} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
                            </span>
                          ) : (
                            <span
                              aria-hidden="true"
                              className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${visual.icon}`}
                              data-docs-package-logo
                            >
                              <span className="text-sm font-semibold">
                                {pkg.displayName.replace(/^@[^/]+\//, '').charAt(0).toUpperCase() || '?'}
                              </span>
                            </span>
                          )}
                          <div className="min-w-0" data-docs-package-copy>
                            <div className="truncate text-base font-semibold leading-5 tracking-tight text-card-foreground">
                              {pkg.displayName}
                            </div>
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className="min-w-0 truncate font-mono text-[11px] leading-4 text-muted-foreground">
                                {pkg.package}
                              </span>
                              {pkg.versioned ? (
                                <span className="shrink-0 rounded-full bg-background/70 px-1.5 py-0.5 text-[11px] font-medium uppercase leading-4 tracking-wider text-muted-foreground">
                                  v{pkg.latestVersion}
                                </span>
                              ) : null}
                            </div>
                            {pkg.description ? (
                              <p className="mt-0.5 truncate text-sm leading-5 text-muted-foreground">{pkg.description}</p>
                            ) : null}
                          </div>
                          <span
                            aria-hidden="true"
                            className="grid size-6 place-items-center rounded-full bg-background/70 text-muted-foreground transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground"
                            data-docs-package-affordance
                          >
                            <ArrowRightIcon />
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                  </section>
                )
              })}

              {packages.length === 0 ? (
                <div className="rounded-3xl bg-card p-8 text-center text-card-foreground shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Docs index is empty. Run <code>bun scripts/sync-docs.ts</code> from the website
                    root.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
