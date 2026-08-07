import { Link } from 'react-router-dom'
import { resolveProductLogoUrl, type ProductRecord } from '../../api/hooks'

/* ──────────────────────────────────────────────
 * The row every apps surface is built from: icon, name, one meta line and the
 * tagline.
 *
 * The source template puts a star rating and a review count on that meta line.
 * Oxy publishes neither, so the line carries what the record actually knows —
 * the category and whether the app is live — rather than a number nobody
 * counted.
 * ──────────────────────────────────────────── */

export function appPath(product: ProductRecord): string {
  return `/apps/${product.productId}`
}

/** Category label when the record carries a populated category, else ''. */
export function categoryLabel(product: ProductRecord): string {
  const category = product.category
  if (!category || typeof category === 'string') return ''
  return category.label ?? ''
}

export function AppIcon({ product, className = '' }: { product: ProductRecord; className?: string }) {
  const logo = resolveProductLogoUrl(product)
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className={`block size-full rounded-sm object-cover ${className}`}
        loading="lazy"
        decoding="async"
      />
    )
  }
  // Most records have no uploaded logo, so the brand mark stands in: an empty
  // hole where the icon goes reads as a broken image.
  return (
    <span
      aria-hidden="true"
      className={`flex size-full items-center justify-center rounded-sm font-display text-[1.25em] ${className}`}
      style={{ background: product.brand, color: product.brandForeground ?? '#ffffff' }}
    >
      {product.mark}
    </span>
  )
}

export default function AppCard({ product, inverted = false }: { product: ProductRecord; inverted?: boolean }) {
  const category = categoryLabel(product)

  return (
    <div className="w-full">
      <Link
        to={appPath(product)}
        className={`group relative flex cursor-pointer items-start gap-4 ${inverted ? 'text-background' : 'text-foreground'}`}
      >
        <figure className="relative w-14 shrink-0 overflow-hidden rounded-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-[1.025]">
          <span className="block aspect-square">
            <AppIcon product={product} />
          </span>
        </figure>

        <div className="flex w-full min-w-0 flex-col items-start gap-1">
          <div className="transition-colors group-hover:opacity-80">{product.name}</div>

          <div className={`relative flex items-center gap-2 text-xs ${inverted ? 'text-background/70' : 'text-muted-foreground'}`}>
            {category && <span>{category}</span>}
            {category && <span className={inverted ? 'text-background/40' : 'text-border'}>•</span>}
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {product.lifecycle === 'live' ? 'Live' : 'In development'}
            </span>
          </div>

          <div className={`text-xs ${inverted ? 'text-background/70' : 'text-muted-foreground'}`}>{product.tagline}</div>
        </div>
      </Link>
    </div>
  )
}
