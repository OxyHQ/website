import { ArrowUpRight } from '@phosphor-icons/react'
import { resolveProductLogoUrl, useProducts, type ProductRecord } from '../../../api/hooks'
import type { NewsroomPost } from '../../../data/newsroom'
import { WIDE_ARTICLE_BLOCK } from '../../slices/articleBlock'
import PillButton from '../../slices/PillButton'

/** The post carries either the id or the populated reference, depending on the route. */
function linkedProductIds(post: NewsroomPost): string[] {
  return post.products.map((product) => (typeof product === 'string' ? product : product.productId))
}

function ProductCallout({ product }: { product: ProductRecord }) {
  const logo = resolveProductLogoUrl(product)
  const category = typeof product.category === 'object' && product.category !== null ? product.category.label : null
  const href = product.landingUrl && product.landingUrl.length > 0 ? product.landingUrl : product.href

  return (
    <aside
      data-toc-skip
      data-toc-collision-target
      className={`${WIDE_ARTICLE_BLOCK} mt-12 grid w-full grid-cols-1 items-center gap-5 rounded-radius-max bg-primary px-6 py-5 text-primary-foreground sm:grid-cols-[1fr_auto] sm:gap-8 lg:mt-16`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-foreground text-primary text-subheading-3">
          {logo ? <img src={logo} alt="" loading="lazy" decoding="async" className="size-full object-cover" /> : product.mark}
        </span>
        <div className="min-w-0">
          <p className="text-body-sm text-primary-foreground/70">{category ? `Related ${category.toLowerCase()} product` : 'Related product'}</p>
          <h3 className="mt-1 text-primary-foreground text-subheading-2">{product.name}</h3>
          <p className="mt-1 max-w-[42rem] text-body-sm text-primary-foreground/80">{product.tagline}</p>
        </div>
      </div>
      <PillButton
        href={href}
        external={product.external}
        size="md"
        className="flex items-center gap-2 !bg-tertiary !text-tertiary-foreground hover:!bg-tertiary/90"
      >
        {product.cta}
        <ArrowUpRight size={18} weight="bold" />
      </PillButton>
    </aside>
  )
}

export default function ArticleProducts({ post }: { post: NewsroomPost }) {
  const { data: products } = useProducts()
  const ids = linkedProductIds(post)
  const linked = (products ?? []).filter((product) => ids.includes(product.productId))

  return <>{linked.map((product) => <ProductCallout key={product.productId} product={product} />)}</>
}
