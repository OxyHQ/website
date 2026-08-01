import { useMemo } from 'react'
import { resolveProductLogoUrl, useProducts, type ProductCategoryRef, type ProductRecord } from '../../api/hooks'
import AppDirectory, { type DirectoryEntry } from '../slices/AppDirectory'
import BannerCta from '../slices/BannerCta'

interface ProductGroup {
  title: string
  order: number
  products: ProductRecord[]
}

/** A slug read as a heading ("finance-commerce"), for records with no category. */
function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' & ')
}

/**
 * Groups by the product's category, which is the record that carries the human
 * label and the running order — `section` is only its slug, and printing that
 * puts "finance-commerce" on the page. Categories are ordered by their own
 * `order`, so admins set the sequence in `/admin/products` without a deploy.
 */
function groupByCategory(products: ProductRecord[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>()
  for (const product of products) {
    const category: ProductCategoryRef | null =
      typeof product.category === 'object' && product.category !== null ? product.category : null
    const key = category?.slug ?? product.section
    const existing = groups.get(key)
    if (existing) {
      existing.products.push(product)
      continue
    }
    groups.set(key, {
      title: category?.label ?? titleFromSlug(product.section),
      order: category?.order ?? Number.MAX_SAFE_INTEGER,
      products: [product],
    })
  }
  return Array.from(groups.values()).sort((a, b) => a.order - b.order)
}

function toEntry(product: ProductRecord): DirectoryEntry {
  // The local marketing page when there is one, the app itself otherwise.
  const landing = product.landingUrl && product.landingUrl.length > 0 ? product.landingUrl : null
  const logo = resolveProductLogoUrl(product)
  return {
    name: product.name,
    tagline: product.tagline,
    href: landing ?? product.href,
    external: product.external && landing === null,
    // Most products have no uploaded logo, so the brand mark stands in — a
    // row with an empty 72px hole reads as a broken image.
    icon: logo || undefined,
    mark: { label: product.mark, background: product.brand, foreground: product.brandForeground ?? '#ffffff' },
  }
}

export default function TechnologiesContent() {
  const { data: products, isPending } = useProducts()

  const groups = useMemo(() => {
    if (!products) return []
    return groupByCategory(products.filter((product) => product.showOnProducts))
  }, [products])

  return (
    <>
      <section className="layout-px-large grid grid-cols-8 gap-x-2.5 sm:grid-cols-12 sm:gap-x-5 md:gap-x-6 bg-gray-a10 pb-20 pt-25 text-gray-a1 lg:gap-y-6 lg:pb-20 lg:pt-30 xl:pb-25 xl:pt-35 2xl:pb-50 2xl:pt-58">
        <h1 className="col-span-full sm:col-span-12 sm:col-start-1 lg:col-start-5 lg:col-span-8 2xl:col-span-7 text-h2b sm:text-h2">
          An ecosystem of apps and integrations for humans
        </h1>
      </section>

      {isPending && <p className="layout-px-large bg-gray-a10 pb-20 text-b1 text-alt-gray-e1">Loading the ecosystem…</p>}

      {/* One pinned heading per section: the heading holds the first four
       * columns while its own apps scroll past in the remaining eight. */}
      {groups.map((group) => (
        <AppDirectory
          key={group.title}
          heading={group.title}
          groups={[{ entries: group.products.map(toEntry) }]}
          className="bg-gray-a10 pb-20 xl:pb-25 2xl:pb-30"
        />
      ))}

      <BannerCta
        title="Build on Oxy"
        body="Every part of the ecosystem is open source, and the SDK is yours to use."
        primary={{ label: 'Get started building', href: '/developers/docs' }}
        secondary={{ label: 'Read the API reference', href: '/developers/docs/api' }}
        background={{ image: '/images/commons/crowd-poster.jpg', video: '/videos/commons-crowd.mp4' }}
      />
    </>
  )
}
