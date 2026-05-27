import { Link } from 'react-router-dom'
import { useProducts, resolveProductLogoUrl, type ProductRecord } from '../../api/hooks'

interface EcosystemTileProps {
  product: ProductRecord
}

function EcosystemTile({ product }: EcosystemTileProps) {
  const logoUrl = resolveProductLogoUrl(product)
  const hasLogo = Boolean(logoUrl)
  const fg = product.brandForeground ?? '#ffffff'
  const destination =
    product.landingUrl && product.landingUrl.length > 0 ? product.landingUrl : product.href
  const isInternal = destination.startsWith('/')

  const tile = (
    <span
      className={`flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-base font-semibold tracking-tight ${
        hasLogo ? 'border border-border/60 bg-surface' : ''
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
  )

  const body = (
    <>
      {tile}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{product.name}</span>
        <span className="truncate text-xs text-muted-foreground">{product.tagline}</span>
      </span>
    </>
  )

  const baseClass =
    'group flex items-center gap-3 rounded-2xl border border-border bg-background p-3 transition-colors duration-300 hover:bg-surface'

  if (isInternal) {
    return (
      <Link to={destination} className={baseClass} aria-label={`${product.name} — ${product.tagline}`}>
        {body}
      </Link>
    )
  }
  return (
    <a
      href={destination}
      target="_blank"
      rel="noopener noreferrer"
      className={baseClass}
      aria-label={`${product.name} — ${product.tagline}`}
    >
      {body}
    </a>
  )
}

/**
 * Live ecosystem strip on /partners — surfaces every product partners can
 * integrate with. Driven by the same `useProducts` data that powers
 * /technologies, so the list stays accurate without a separate logo file.
 *
 * Renders nothing when no live products are returned (network error,
 * empty CMS) so the section never becomes a bare heading.
 */
export default function PartnerEcosystemStrip() {
  const { data: products = [] } = useProducts({ surface: 'products', lifecycle: 'live' })
  const visible = products.slice(0, 12)
  if (visible.length === 0) return null

  return (
    <section className="container">
      <div className="border-x border-border">
        <header className="grid grid-cols-12 justify-items-start pb-12 pt-25 max-xl:pb-10 max-xl:pt-20 max-lg:pt-16">
          <div className="col-[2/-2] flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-[26em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
              <h2 className="text-pretty inline">Plug into the Oxy ecosystem.</h2>{' '}
              <p className="text-pretty inline font-medium text-muted-foreground">
                One identity layer, one contract — every product partners can build on.
              </p>
            </div>
            <Link
              to="/technologies"
              className="shrink-0 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              See all technologies
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-12">
          <div className="col-[2/-2] grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((product) => (
              <EcosystemTile key={product.productId} product={product} />
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="grid h-25 w-full grid-cols-12 overflow-hidden max-xl:h-20 max-lg:h-15"
        >
          <div className="col-[2/-2] flex justify-between" />
        </div>
      </div>
    </section>
  )
}
