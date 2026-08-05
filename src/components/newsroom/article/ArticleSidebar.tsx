import { ArrowUpRight } from '@phosphor-icons/react'
import { useProducts, resolveProductLogoUrl, type ProductRecord } from '../../../api/hooks'
import type { NewsroomPost } from '../../../data/newsroom'
import TableOfContents from '../../ui/TableOfContents'
import type { ArticleHeading } from './headings'

/**
 * The column beside the article: what the article is ABOUT, then where you are
 * in it.
 *
 * A post links the products it announces, so those resolve to real product
 * records — name, tagline, category, and the link the product itself declares.
 * A post with no product linked shows the contents list alone, and a post with
 * neither renders nothing, which is what lets the page hand the body its full
 * width instead of leaving an empty gutter.
 */

/** The post carries either the id or the populated reference, depending on the route. */
function linkedProductIds(post: NewsroomPost): string[] {
  return post.products.map((product) => (typeof product === 'string' ? product : product.productId))
}

function ProductPanel({ product }: { product: ProductRecord }) {
  const logo = resolveProductLogoUrl(product)
  // Most products have no uploaded logo; the brand mark stands in, as it does
  // in the ecosystem directory.
  const category = typeof product.category === 'object' && product.category !== null ? product.category.label : null
  const href = product.landingUrl && product.landingUrl.length > 0 ? product.landingUrl : product.href

  return (
    <article className="flex flex-col rounded-radius-12 border border-border bg-fill">
      <div className="flex w-full flex-col items-start gap-6 p-6">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-radius-8 border border-border text-lg font-semibold"
              style={logo ? undefined : { background: product.brand, color: product.brandForeground ?? '#ffffff' }}
            >
              {logo ? <img src={logo} alt="" loading="lazy" decoding="async" className="size-10" /> : product.mark}
            </span>
            <p className="text-lg font-semibold text-text">{product.name}</p>
          </div>
          {category && (
            <p className="rounded-radius-8 bg-fill-secondary px-2 py-1 font-mono text-xs uppercase tracking-wider text-text-secondary">
              {category}
            </p>
          )}
        </div>
        <p className="text-base text-text-secondary">{product.tagline}</p>
      </div>
      <div className="w-full border-t border-border p-6">
        <a
          href={href}
          target={product.external ? '_blank' : undefined}
          rel={product.external ? 'noopener noreferrer' : undefined}
          className="flex h-12 w-full items-center justify-between gap-2 rounded-radius-8 bg-fill-secondary px-4 text-text transition-colors hover:bg-fill-hover"
        >
          <span className="font-semibold">{product.cta}</span>
          <ArrowUpRight size={20} weight="bold" />
        </a>
      </div>
    </article>
  )
}

interface ArticleSidebarProps {
  post: NewsroomPost
  headings: ArticleHeading[]
}

export default function ArticleSidebar({ post, headings }: ArticleSidebarProps) {
  const { data: products } = useProducts()
  const ids = linkedProductIds(post)
  const linked = (products ?? []).filter((product) => ids.includes(product.productId))

  if (linked.length === 0 && headings.length === 0) return null

  return (
    <aside className="w-full shrink-0 border-border lg:w-96 lg:border-l">
      <div className="sticky top-12 flex flex-col gap-8 py-4 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pl-6 xl:px-4">
        {linked.map((product) => (
          <ProductPanel key={product.productId} product={product} />
        ))}
        {headings.length > 0 && (
          <TableOfContents
            sticky={false}
            headings={headings.map((heading) => ({ id: heading.id, label: heading.text, level: heading.level }))}
          />
        )}
      </div>
    </aside>
  )
}
