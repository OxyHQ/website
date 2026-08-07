import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProducts, type ProductRecord } from '../../api/hooks'
import Button from '../ui/Button'
import AppCard from './AppCard'

/* ──────────────────────────────────────────────
 * /apps
 *
 * The directory, on the pasted store-front layout: a dark band pairing the
 * headline with the first apps, then the rest grouped the way the records
 * themselves are grouped, an editorial card, and the closing bands.
 *
 * Everything on this page is a product record. What the source template has
 * and Oxy does not — ratings, review counts, install counts, price tiers — is
 * left out rather than filled with a plausible number.
 * ──────────────────────────────────────────── */

const ArrowGlyph = () => (
  <span aria-hidden="true" className="inline-block ps-[0.375em] transition-transform will-change-transform group-hover/link:translate-x-1">
    <svg viewBox="0 0 6 10" fill="currentColor" className="mb-[0.025em] inline h-[0.5em]">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.219 0.22c.3-.3.77-.3 1.06 0l4.25 4.25c.3.3.3.77 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L3.939 5 .219 1.28a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  </span>
)

function HeroSection({ products }: { products: ProductRecord[] }) {
  return (
    <section className="relative bg-foreground bg-cover bg-center text-background">
      <div className="container">
        <div className="grid w-full grid-flow-dense grid-cols-12 gap-gutter py-xl md:py-2xl lg:gap-x-gutter-lg lg:py-3xl">
          <div className="col-span-full flex flex-wrap justify-between lg:col-span-4 xl:col-span-6">
            <div className="flex flex-col gap-2xs pb-sm sm:gap-2xs md:gap-xs">
              <h1 className="text-balance text-display-6 lg:pb-xl lg:text-heading-3xl xl:pb-2xl xl:text-display-6">
                Every app in the ecosystem, one account you own
              </h1>
              <span className="hidden lg:inline-block">
                <Link className="group/link no-underline hover:underline" to="/technologies">
                  See how they fit together
                  <ArrowGlyph />
                </Link>
              </span>
            </div>
          </div>

          <div className="col-span-full lg:col-span-8 xl:col-span-6">
            <div className="grid grid-flow-dense grid-cols-1 gap-gutter md:grid-cols-2 md:gap-gutter-lg">
              {products.map((product) => (
                <AppCard key={product.productId} product={product} inverted />
              ))}
            </div>
          </div>

          <div className="col-span-full w-full pt-4 lg:hidden">
            <Link className="group/link no-underline hover:underline" to="/technologies">
              See how they fit together
              <ArrowGlyph />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function AppGridSection({
  title,
  products,
  columns,
}: {
  title: string
  products: ProductRecord[]
  columns: string
}) {
  if (products.length === 0) return null
  return (
    <section className="flex w-full flex-col gap-gutter lg:gap-x-gutter-lg">
      <div className="flex flex-wrap justify-between">
        <h2 className="text-heading-xl">{title}</h2>
      </div>
      <div className={`grid grid-flow-dense gap-gutter lg:gap-x-gutter-lg ${columns}`}>
        {products.map((product) => (
          <AppCard key={product.productId} product={product} />
        ))}
      </div>
    </section>
  )
}

/** The editorial card beside the grid: a real document, not a promo. */
function EditorialCard() {
  return (
    <div className="flex h-full overflow-hidden rounded-radius-8 bg-foreground text-background">
      <div className="flex flex-col justify-between p-lg xl:p-xl">
        <div>
          <p className="pb-xs text-heading-md">The Founding Charter</p>
          <h3 className="text-balance text-heading-xl">
            What every app here promises: no ads, no data sales, and the right to leave.
          </h3>
        </div>
        <div className="pt-lg md:pt-xl lg:pt-2xl xl:pt-3xl">
          <Link className="group/link no-underline hover:underline" to="/company/charter">
            Read the charter
            <ArrowGlyph />
          </Link>
        </div>
      </div>
    </div>
  )
}

const ADVANTAGES = [
  {
    title: 'One account, everywhere',
    body: 'Sign in once and every app in the ecosystem knows you, without a new password, a new profile or a new company holding your identity.',
  },
  {
    title: 'Open by default',
    body: 'The core of what runs here is public, so you can read what an app does before you trust it, and fork it if we get it wrong.',
  },
  {
    title: 'Nobody is the product',
    body: 'No advertising and no data sales anywhere in the ecosystem. That constraint is written into the charter, not into a settings page.',
  },
]

function AdvantageSection() {
  return (
    <section className="w-full border-border border-y bg-surface pb-8 lg:pb-16">
      <div className="container flex flex-col gap-xl py-2xl md:flex-row lg:py-3xl">
        <div className="flex basis-1/2 flex-col justify-start md:items-start">
          <h2 className="mb-sm text-heading-3xl md:mb-md">The Oxy app advantage</h2>
          <p className="text-body-xl text-muted-foreground lg:max-w-[24em]">
            Every app here is built on the same identity, the same design system and the same promises.
          </p>
          <div className="mt-8 hidden md:block">
            <Button variant="primary" size="lg" href="/company/charter">
              Read the charter
            </Button>
          </div>
        </div>
        <ul className="flex basis-1/2 flex-col gap-lg lg:gap-xl">
          {ADVANTAGES.map((item) => (
            <li key={item.title} className="lg:max-w-[34em]">
              <h3 className="text-heading-lg">{item.title}</h3>
              <p className="mt-2xs text-body-lg text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
        <div className="block md:hidden">
          <Button variant="primary" size="lg" responsive href="/company/charter" className="w-full">
            Read the charter
          </Button>
        </div>
      </div>
    </section>
  )
}

function ClosingSection() {
  return (
    <div className="bg-foreground">
      <div className="container flex flex-col items-center gap-xl py-2xl text-background lg:py-4xl">
        <h2 className="text-center text-display-5">
          Want to build one?
        </h2>
        <Button
          variant="primary"
          size="lg"
          responsive
          href="/developers/docs"
          className="border-transparent bg-background text-foreground hover:bg-background/90"
        >
          Start with the developer docs
        </Button>
      </div>
    </div>
  )
}

export default function AppsContent() {
  const { data: products, isPending } = useProducts({ surface: 'products' })

  const { featured, live, upcoming } = useMemo(() => {
    const all = [...(products ?? [])].sort((a, b) => a.order - b.order)
    const published = all.filter((product) => product.lifecycle === 'live')
    return {
      featured: published.slice(0, 6),
      live: published.slice(6),
      upcoming: all.filter((product) => product.lifecycle !== 'live'),
    }
  }, [products])

  return (
    <>
      <HeroSection products={featured} />

      {isPending && (
        <div className="container py-2xl lg:py-3xl">
          <p className="text-muted-foreground">Loading the ecosystem…</p>
        </div>
      )}

      <div className="container my-xl md:my-2xl lg:my-3xl">
        <div className="flex flex-wrap gap-gutter-lg lg:flex-nowrap">
          <div className="basis-full lg:basis-2/3 xl:basis-3/4">
            <AppGridSection
              title="Across the ecosystem"
              products={live}
              columns="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            />
          </div>
          <div className="basis-full lg:basis-1/3 xl:basis-1/4">
            <EditorialCard />
          </div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="container my-xl md:my-2xl lg:my-3xl">
          <AppGridSection
            title="In the making"
            products={upcoming}
            columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          />
        </div>
      )}

      <AdvantageSection />
      <ClosingSection />
    </>
  )
}
