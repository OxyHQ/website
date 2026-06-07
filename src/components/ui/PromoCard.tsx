import { Link } from 'react-router-dom'

export interface PromoCardProps {
  image: string
  title: string
  description: string
  href: string
  alt?: string
  /** Rounding/overflow/extra classes from the caller (nav panel, carousel, …). */
  className?: string
}

/**
 * Image-led promo card: a full-bleed image with a gradient-anchored title and
 * description; the whole card links to `href`. Shape (rounding) is left to the
 * caller via `className` so it drops cleanly into nav dropdown panels, the hero
 * carousel, or anywhere else.
 */
export function PromoCard({ image, title, description, href, alt, className = '' }: PromoCardProps) {
  const media = (
    <>
      <img
        src={image}
        alt={alt ?? title}
        className="h-full w-full object-cover object-left transition-transform duration-500 ease-out group-hover:scale-105"
      />
      {/* Caption fades into the Bloom theme background, so text stays readable in
          both light and dark mode via the semantic tokens below. */}
      <div className="absolute inset-x-0 bottom-0 flex h-64 items-end justify-center bg-gradient-to-b from-transparent to-background">
        <div className="w-full overflow-hidden p-5">
          <p className="flex items-center font-semibold text-foreground">{title}</p>
          <p className="mt-1.5 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
            {description}
          </p>
        </div>
      </div>
    </>
  )
  // border token gives the card a defined edge in both themes (the gradient now
  // fades into the theme background, so it would otherwise blend at the bottom).
  const cls = `group relative block h-full w-full cursor-pointer overflow-hidden border border-border ${className}`
  return href.startsWith('/') ? (
    <Link to={href} className={cls}>
      {media}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {media}
    </a>
  )
}
