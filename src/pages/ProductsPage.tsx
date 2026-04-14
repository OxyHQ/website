import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'

/* ──────────────────────────────────────────────
 * /products
 *
 * High-level overview of every product in the Oxy ecosystem.
 * Each card links to its dedicated page (or to the external product
 * surface for products that don't have a marketing page on this site).
 *
 * Layout follows the canonical CompanyPage / HomePage patterns:
 *   container > border-x > grid grid-cols-12 > col-[2/-2]
 * Dashed rule helpers (DashedHLine / DashedVLines) match CompanyPage.
 * Brand colors are real product colors, not generic theme tokens —
 * they live on each card via inline CSS variables.
 * ──────────────────────────────────────────── */

interface Product {
  /** URL-safe id, used as React key */
  id: string
  /** Display name */
  name: string
  /** Single-line tag shown above the title on each card */
  tagline: string
  /** Short description shown in the card body */
  description: string
  /** Where the card's primary CTA should send the visitor */
  href: string
  /** True when the destination is off-site (opens in new tab, gets the arrow) */
  external?: boolean
  /** CTA label (defaults vary by destination type) */
  cta: string
  /** Hex brand color used for the card accent strip + icon mark */
  brand: string
  /** Optional contrasting color for the icon mark text — defaults to white */
  brandForeground?: string
  /** Single emoji-free letter mark used inside the brand square */
  mark: string
}

/* ── Live products — featured grid ── */
const LIVE_PRODUCTS: readonly Product[] = [
  {
    id: 'alia',
    name: 'Alia AI',
    tagline: 'Intelligent assistant',
    description:
      'Your private AI assistant on web, iOS and Android. Ask anything, get answers, automate work — without your data feeding a training set.',
    href: 'https://alia.onl/',
    external: true,
    cta: 'Open Alia',
    brand: '#7c3aed',
    mark: 'A',
  },
  {
    id: 'mention',
    name: 'Mention',
    tagline: 'Open social network',
    description:
      'A social network built on respect. No engagement-maxxing algorithms, no surveillance ads — just genuine connection on the open fediverse.',
    href: 'https://mention.earth/',
    external: true,
    cta: 'Visit Mention',
    brand: '#0ea5e9',
    mark: 'M',
  },
  {
    id: 'inbox',
    name: 'Oxy Inbox',
    tagline: 'Unified messaging',
    description:
      'All your email, chat and federated messages in one calm place. Smart triage surfaces what matters, end-to-end encrypted by default.',
    href: '/inbox',
    cta: 'Explore Inbox',
    brand: '#1e40af',
    mark: 'I',
  },
  {
    id: 'codea',
    name: 'Codea',
    tagline: 'Open-source code editor',
    description:
      'A professional AI code editor that runs in your browser, on your machine, or self-hosted. Write, review and ship — on your terms.',
    href: '/codea',
    cta: 'Explore Codea',
    brand: '#0f172a',
    mark: 'C',
  },
  {
    id: 'oxy-ai',
    name: 'Oxy AI',
    tagline: 'Models, API and SDKs',
    description:
      'Privacy-first AI for developers. Open models you can inspect, fine-tune and self-host — backed by a fast, multilingual API.',
    href: '/ai',
    cta: 'Explore Oxy AI',
    brand: '#dc2626',
    mark: 'O',
  },
  {
    id: 'tnp',
    name: 'TNP',
    tagline: 'Alternative namespace',
    description:
      'The Network Protocol — register names on .ox, .app, .com and more. DNS-only, system-wide, and fully under your control.',
    href: '/tnp',
    cta: 'Explore TNP',
    brand: '#10b981',
    mark: 'T',
  },
  {
    id: 'oxyos',
    name: 'Oxy OS',
    tagline: 'Operating system',
    description:
      'An operating system designed around privacy and user freedom. Your computer, your data — no telemetry, no tracking, no compromises.',
    href: '/os',
    cta: 'Explore Oxy OS',
    brand: '#f97316',
    mark: 'X',
  },
  {
    id: 'faircoin',
    name: 'FairCoin',
    tagline: 'Currency that cares',
    description:
      'Cryptocurrency built for sustainability, not speculation. Powering ethical commerce and local economies worldwide.',
    href: 'https://fair.coop/',
    external: true,
    cta: 'Visit FairCoin',
    brand: '#16a34a',
    mark: 'F',
  },
  {
    id: 'homiio',
    name: 'Homiio',
    tagline: 'Affordable housing',
    description:
      'Technology that makes affordable housing accessible. Connecting people with homes they can actually afford, neighbourhood by neighbourhood.',
    href: 'https://homiio.com/',
    external: true,
    cta: 'Visit Homiio',
    brand: '#e11d48',
    mark: 'H',
  },
] as const

/* ── In-development / new — secondary section ── */
const NEW_PRODUCTS: readonly Product[] = [
  {
    id: 'astro',
    name: 'Astro',
    tagline: 'AI browser',
    description:
      'Browse the web with AI by your side. Astro gives you instant answers, smarter suggestions and help with tasks — privacy you control.',
    href: '/astro',
    cta: 'Explore Astro',
    brand: '#a855f7',
    mark: 'A',
  },
  {
    id: 'codex-extension',
    name: 'Codex Extension',
    tagline: 'Codea, everywhere you code',
    description:
      'Bring Codea\u2019s open-source AI assistant into the editor you already use. Reviews, refactors and completions — free to inspect, free to extend.',
    href: '/codea/extension',
    cta: 'Explore the extension',
    brand: '#475569',
    mark: 'E',
  },
] as const

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

function ProductCardLink({ product, children }: { product: Product; children: React.ReactNode }) {
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

function ProductCard({ product }: { product: Product }) {
  const fg = product.brandForeground ?? '#ffffff'
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
          className="flex size-11 items-center justify-center rounded-2xl text-lg font-semibold tracking-tight"
          style={{ backgroundColor: product.brand, color: fg }}
          aria-hidden="true"
        >
          {product.mark}
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

        {/* ═══ Live products grid ═══ */}
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

            {/* Pixel-gap card grid — matches CompanyPage values/team layout */}
            <div className="relative grid grid-cols-12">
              <div
                className="pointer-events-none absolute inset-0 text-border/30"
                style={{ backgroundImage: 'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)' }}
                aria-hidden="true"
              />
              <div className="relative col-[2/-2] grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3">
                {LIVE_PRODUCTS.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ New / in-development ═══ */}
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
                {NEW_PRODUCTS.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

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
