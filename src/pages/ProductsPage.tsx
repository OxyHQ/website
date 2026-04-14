import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useProducts, resolveProductLogoUrl, type ProductRecord } from '../api/hooks'

function groupBySection(products: ProductRecord[]): Array<[string, ProductRecord[]]> {
  const map = new Map<string, ProductRecord[]>()
  for (const p of products) {
    const list = map.get(p.section) ?? []
    list.push(p)
    map.set(p.section, list)
  }
  return Array.from(map.entries())
}

/* ──────────────────────────────────────────────
 * /products
 *
 * High-level overview of every product in the Oxy ecosystem. Data comes
 * from the CMS via useProducts(); edit it in the admin at /admin/products
 * or through the MCP tools (list_products, create_product, update_product,
 * delete_product).
 *
 * Layout follows the canonical CompanyPage / HomePage patterns:
 *   container > border-x > grid grid-cols-12 > col-[2/-2]
 * Dashed rule helpers (DashedHLine / DashedVLines) match CompanyPage.
 * Brand colors come straight from the CMS — real product brand colors,
 * not theme tokens.
 * ──────────────────────────────────────────── */

/* ── Layout primitives — match CompanyPage helpers ── */

function DashedHLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

function DashedVLines({ height = 'h-5' }: { height?: string }) {
  return (
    <div className={`grid w-full grid-cols-12 overflow-hidden ${height}`}>
      <div className="col-[2/-2] flex justify-between">
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
        <svg width="1" height="100%" className="text-border">
          <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

/* ── Reusable arrow icons ── */

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  )
}

function ArrowUpRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  )
}

/* ── Product card ── */

function ProductCardLink({ product, children }: { product: ProductRecord; children: React.ReactNode }) {
  if (product.external) {
    return (
      <a
        href={product.href}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-full flex-col bg-background p-8 transition-colors duration-300 hover:bg-surface lg:p-10"
        aria-label={`${product.name} — ${product.tagline}`}
      >
        {children}
      </a>
    )
  }
  return (
    <Link
      to={product.href}
      className="group relative flex h-full flex-col bg-background p-8 transition-colors duration-300 hover:bg-surface lg:p-10"
      aria-label={`${product.name} — ${product.tagline}`}
    >
      {children}
    </Link>
  )
}

function ProductCard({ product }: { product: ProductRecord }) {
  const fg = product.brandForeground ?? '#ffffff'
  const logoUrl = resolveProductLogoUrl(product)
  const hasLogo = Boolean(logoUrl)
  return (
    <ProductCardLink product={product}>
      {/* Brand accent strip — uses real product brand color, not a theme token */}
      <span
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"
        style={{ backgroundColor: product.brand }}
        aria-hidden="true"
      />

      {/* Brand mark + tagline row */}
      <div className="flex items-center gap-3">
        <span
          className={`relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-semibold tracking-tight ${
            hasLogo ? 'bg-surface border border-border/60' : ''
          }`}
          style={hasLogo ? undefined : { backgroundColor: product.brand, color: fg }}
          aria-hidden="true"
        >
          {hasLogo ? (
            <img
              src={logoUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-1.5"
            />
          ) : (
            product.mark
          )}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {product.tagline}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-6 text-2xl font-medium text-foreground">{product.name}</h3>

      {/* Description */}
      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
        {product.description}
      </p>

      {/* CTA — pinned to bottom on tall cards */}
      <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        {product.cta}
        {product.external ? (
          <ArrowUpRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        ) : (
          <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        )}
      </span>
    </ProductCardLink>
  )
}

/* ── Page ── */

export default function ProductsPage() {
  const { data: products = [] } = useProducts({ surface: 'products' })
  const liveProducts = products.filter((p) => p.lifecycle === 'live')
  const newProducts = products.filter((p) => p.lifecycle === 'in-development')
  const liveGroups = groupBySection(liveProducts)
  const hasLive = liveProducts.length > 0
  const hasNew = newProducts.length > 0

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Products"
        description="Every product in the Oxy ecosystem — Alia AI, Mention, Inbox, Codea, Oxy AI, TNP, Oxy OS, FairCoin, Homiio and more. Open-source, privacy-first tools that put people first."
        canonicalPath="/products"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div className="lg:border-border lg:border-x">
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
              <div className="col-[2/-2] flex flex-col items-center gap-4 text-center">
                <div className="mb-6 inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-foreground">
                  The Oxy ecosystem
                </div>
                <h1 className="max-w-[18em] text-balance text-heading-responsive-lg">
                  Every product in the Oxy ecosystem.
                </h1>
                <p className="mt-4 max-w-2xl text-balance text-lg text-muted-foreground lg:text-xl">
                  Open-source, privacy-first software for messaging, intelligence, identity and beyond.
                  One ecosystem, built around the people who use it.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Button variant="primary" size="md" responsive href="/developers/docs">
                    Build on Oxy
                  </Button>
                  <Button variant="outline" size="md" responsive href="/initiative">
                    Our initiative
                  </Button>
                </div>
              </div>
            </header>
          </div>
        </section>

        {/* ═══ Live products — grouped by section ═══ */}
        {hasLive && (
          <section className="container" id="all-products">
            <div className="border-border border-x">
              <DashedHLine />
              <DashedVLines />

              <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
                <div className="col-[2/-2] max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                  <h2 className="text-pretty inline">Built and shipped.</h2>{' '}
                  <p className="inline text-pretty font-medium text-muted-foreground">
                    Products you can use today — each independently developed, each tied to the same open ecosystem.
                  </p>
                </div>
              </header>

              <DashedVLines />

              {liveGroups.map(([section, items]) => (
                <div key={section}>
                  {/* Section label */}
                  <div className="grid grid-cols-12 pt-10 pb-5">
                    <div className="col-[2/-2]">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section}</p>
                    </div>
                  </div>

                  {/* Pixel-gap card grid */}
                  <div className="relative grid grid-cols-12">
                    <div
                      className="pointer-events-none absolute inset-0 text-border/30"
                      style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
                      aria-hidden="true"
                    />
                    <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((product) => (
                        <ProductCard key={product.productId} product={product} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <DashedVLines height="h-21 md:h-40" />
            </div>
          </section>
        )}

        {/* ═══ New / in-development ═══ */}
        {hasNew && (
          <section className="container">
            <div className="border-border border-x">
              <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
                <div className="col-[2/-2] flex w-full items-end justify-between gap-6">
                  <div className="max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                    <h2 className="text-pretty inline">New and in development.</h2>{' '}
                    <p className="inline text-pretty font-medium text-muted-foreground">
                      Fresh products and tooling we&apos;re building in the open right now.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" href="/changelog">
                    Changelog
                  </Button>
                </div>
              </header>

              <DashedVLines />

              <div className="relative grid grid-cols-12">
                <div
                  className="pointer-events-none absolute inset-0 text-border/30"
                  style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
                  aria-hidden="true"
                />
                <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-2">
                  {newProducts.map((product) => (
                    <ProductCard key={product.productId} product={product} />
                  ))}
                </div>
              </div>

              <DashedVLines height="h-21 md:h-40" />
            </div>
          </section>
        )}

        {/* ═══ Build on Oxy CTA ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-[2/-2] py-20 max-lg:py-16">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
                  <span className="inline-block rounded-full border border-border bg-background px-3 py-1.5 text-[13px]/[1.4em] font-medium text-muted-foreground">
                    For developers
                  </span>
                  <h2 className="text-balance text-heading-responsive-md">
                    Build on the Oxy platform.
                  </h2>
                  <p className="max-w-xl text-pretty text-muted-foreground">
                    Open APIs, open SDKs and an ecosystem you can actually inspect. Ship your own client,
                    plug into Mention&apos;s federation, or self-host the entire stack — your choice.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" size="md" responsive href="/developers/docs">
                      Read the docs
                    </Button>
                    <Button variant="outline" size="md" responsive href="/developers/docs/overview">
                      API overview
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Keep up to date ═══ */}
        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
