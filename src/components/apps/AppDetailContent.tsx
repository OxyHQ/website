import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as Skeleton from '@oxyhq/bloom/skeleton'
import { useProduct, useProducts, resolveProductCategoryId, type ProductRecord } from '../../api/hooks'
import { getStaticChangelog } from '../../content/changelog-loader'
import Button from '../ui/Button'
import SEO from '../SEO'
import { APP_CARD_IMAGES } from '../../data/appCardImages'
import StructuredData from '../StructuredData'
import AppCard, { AppIcon, categoryLabel } from './AppCard'

/* ──────────────────────────────────────────────
 * /apps/:name
 *
 * The listing page: what the app is, pinned beside the story of what it does.
 *
 * The source template's meta column carries pricing, a star rating and a
 * review count. Oxy publishes none of those, so this one carries what the
 * record knows and what the repositories prove — category, whether it is live,
 * who builds it, and where to read the code.
 * ──────────────────────────────────────────── */

/** Screenshots we actually have, by product. No entry means no gallery. */
const SCREENSHOTS: Record<string, string[]> = {
  mention: ['/images/screenshots/mention-app.png'],
  alia: ['/images/screenshots/alia-app.png'],
  inbox: ['/images/screenshots/inbox-app.png'],
}

/**
 * The tracked repository for a product, when one matches by name. Compared on
 * letters only, so `oxy-pay` and `OxyPay` are the same repository.
 */
function findRepo(product: ProductRecord): { owner: string; name: string } | null {
  const letters = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '')
  const wanted = letters(product.productId)
  const match = getStaticChangelog().repos.find(
    (repo) => letters(repo.name) === wanted || letters(repo.displayName) === wanted,
  )
  return match ? { owner: repoOwner(match.owner), name: match.name } : null
}

/** Repos carry their owner; fall back to the org when one is missing. */
function repoOwner(owner: string): string {
  return owner || 'OxyHQ'
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="mb-space-xs text-heading-sm sm:text-heading-xs">{label}</dt>
      <dd className="text-body-sm text-muted-foreground">{children}</dd>
    </div>
  )
}

export default function AppDetailContent() {
  const { name = '' } = useParams<{ name: string }>()
  const { data: product, isPending, isError } = useProduct(name)
  const { data: products = [] } = useProducts({ surface: 'products' })

  const related = useMemo(() => {
    if (!product) return []
    const categoryId = resolveProductCategoryId(product)
    return products
      .filter((candidate) => candidate.productId !== product.productId)
      .filter((candidate) => (categoryId ? resolveProductCategoryId(candidate) === categoryId : candidate.section === product.section))
      .slice(0, 4)
  }, [products, product])

  if (isPending) {
    return (
      <div className="container py-space-2xl lg:py-space-3xl">
        <div className="max-w-space-2xl space-y-6">
          <Skeleton.Box width={96} height={96} borderRadius={12} />
          <Skeleton.Box width={280} height={40} />
          <Skeleton.Box width="100%" height={16} />
          <Skeleton.Box width="80%" height={16} />
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <>
        <SEO
          title="App not found"
          description="This app doesn't exist or has been renamed."
          canonicalPath={`/apps/${name}`}
          noIndex
        />
        <div className="container py-space-2xl lg:py-space-3xl">
          <h1 className="text-heading-3xl">App not found.</h1>
          <p className="pt-6 text-muted-foreground">This app doesn&apos;t exist, or it has been renamed.</p>
          <p className="pt-8">
            <Link to="/apps" className="underline underline-offset-4">
              Browse every app
            </Link>
          </p>
        </div>
      </>
    )
  }

  const category = categoryLabel(product)
  const repo = findRepo(product)
  const shots = SCREENSHOTS[product.productId] ?? []
  const landing = product.landingUrl && product.landingUrl.length > 0 ? product.landingUrl : null
  const openHref = landing ?? product.href
  const opensExternally = openHref.startsWith('http')

  return (
    <div className="container my-space-xl md:my-space-2xl lg:my-space-3xl">
      <SEO
        title={`${product.name}, ${category || 'Oxy'}`}
        description={product.tagline || product.description}
        canonicalPath={`/apps/${product.productId}`}
        ogImage={APP_CARD_IMAGES[`/apps/${product.productId}`]}
      />
      <StructuredData
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: product.name,
          description: product.description || product.tagline,
          applicationCategory: category || undefined,
          url: `https://oxy.so/apps/${product.productId}`,
          publisher: { '@type': 'Organization', name: 'Oxy', sameAs: 'https://oxy.so' },
        }}
      />

      <div className="grid grid-cols-12 items-start gap-space-gutter lg:gap-x-space-gutter-lg">
        {/* ── The app itself, pinned ── */}
        <div className="col-span-full mb-space-lg lg:sticky lg:top-[calc(var(--site-header-height)+var(--spacing-space-xl))] lg:col-span-3 lg:mb-0">
          <section className="flex flex-col gap-space-xl xs:flex-row lg:flex-col">
            <div className="flex grow flex-col gap-space-xl">
              <div className="flex items-stretch gap-space-md">
                <figure className="relative size-space-3xl shrink-0 overflow-hidden rounded-radius-8 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] lg:size-space-app-icon-sm">
                  <AppIcon product={product} />
                </figure>
                <div className="flex flex-col justify-center">
                  <h1 className="text-balance text-heading-lg">{product.name}</h1>
                </div>
              </div>

              <dl className="flex flex-col gap-space-xl border-border border-t pt-space-xl">
                {category && (
                  <MetaRow label="Category">
                    <Link to="/apps" className="underline underline-offset-4">
                      {category}
                    </Link>
                  </MetaRow>
                )}
                <MetaRow label="Availability">
                  {product.lifecycle === 'live' ? 'Live' : 'In development'}
                </MetaRow>
                <MetaRow label="Built by">
                  <Link to="/company" className="underline underline-offset-4">
                    Oxy
                  </Link>
                </MetaRow>
                {repo && (
                  <MetaRow label="Source">
                    <a
                      href={`https://github.com/${repo.owner}/${repo.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      {repo.owner}/{repo.name}
                    </a>
                  </MetaRow>
                )}
              </dl>
            </div>

            <div className="shrink-0">
              <Button
                variant="primary"
                size="lg"
                responsive
                href={openHref}
                className="w-full"
                {...(opensExternally ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {product.cta || 'Open'}
              </Button>
            </div>
          </section>
        </div>

        {/* ── What it does ── */}
        <div className="col-span-full lg:col-span-8 lg:pl-8">
          {shots.length > 0 && (
            <div className="mb-8 overflow-hidden rounded-sm border border-border">
              {shots.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt={`${product.name} in use`}
                  className="block w-full"
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
          )}

          <div className="mb-space-2xl flex flex-col gap-space-lg">
            <h2 className="text-pretty text-heading-lg">{product.tagline}</h2>
            {product.description && <p className="text-body-md text-muted-foreground">{product.description}</p>}
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-4 gap-x-space-gutter border-border border-t pt-space-sm lg:gap-x-space-gutter-lg">
              <p className="col-span-full text-heading-sm sm:col-span-1 sm:text-heading-xs">Works with</p>
              <p className="col-span-full text-body-md text-muted-foreground sm:col-span-3">
                Your Oxy account, on every other app in the ecosystem. One sign-in, one identity, and the same design
                system underneath.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-x-space-gutter border-border border-t pt-space-sm lg:gap-x-space-gutter-lg">
              <p className="col-span-full text-heading-sm sm:col-span-1 sm:text-heading-xs">Status</p>
              <p className="col-span-full text-body-md text-muted-foreground sm:col-span-3">
                <Link to="/status" className="underline underline-offset-4">
                  Live health for every service
                </Link>
              </p>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-12 border-border border-t pt-8">
              <h2 className="mb-space-lg text-heading-xl">More in the ecosystem</h2>
              <div className="grid grid-cols-1 gap-space-gutter md:grid-cols-2 md:gap-space-gutter-lg">
                {related.map((item) => (
                  <AppCard key={item.productId} product={item} />
                ))}
              </div>
              <p className="pt-8">
                <Link to="/apps" className="underline underline-offset-4">
                  Browse every app
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
