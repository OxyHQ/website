import { useState } from 'react'
import { Button } from '@oxy.so/bloom/button'
import PageShell from '../components/layout/PageShell'
import StoreProductImage from '../components/store/StoreProductImage'
import StoreBag from '../components/store/StoreBag'
import { useStoreBag } from '../components/store/useStoreBag'
import { STORE_PRODUCTS, type StoreCategory, type StoreProduct } from '../data/store'
import { useCurrentLocale, useTranslation } from '../lib/i18n'
import { Link } from '../lib/navigation'

const categories = ['all', 'wear', 'carry', 'desk', 'drink'] as const
// Same portrait / square / landscape rhythm as the supplied Tailwind template.
const shapes = [
  'w-[calc(44.44%-var(--layout-gap)/2)] md:w-[calc(26.23%-var(--layout-gap)*2/3)] lg:w-[calc(var(--image-height)*.8)]',
  'w-[calc(55.56%-var(--layout-gap)/2)] md:w-[calc(32.79%-var(--layout-gap)*2/3)] lg:w-(--image-height)',
  'w-[calc(60.98%-var(--layout-gap)/2)] md:w-[calc(40.98%-var(--layout-gap)*2/3)] lg:w-[calc(var(--image-height)*1.25)]',
  'w-[calc(39.02%-var(--layout-gap)/2)] md:w-[calc(28.07%-var(--layout-gap)*2/3)] lg:w-[calc(var(--image-height)*.8)]',
  'w-[calc(39.02%-var(--layout-gap)/2)] md:w-[calc(28.07%-var(--layout-gap)*2/3)] lg:w-[calc(var(--image-height)*.8)]',
  'w-[calc(60.98%-var(--layout-gap)/2)] md:w-[calc(43.86%-var(--layout-gap)*2/3)] lg:w-[calc(var(--image-height)*1.25)]',
]
const aspects = ['aspect-[4/5]', 'aspect-square', 'aspect-[5/4]', 'aspect-[4/5]', 'aspect-[4/5]', 'aspect-[5/4]']

export default function StorePage() {
  const { t } = useTranslation()
  const locale = useCurrentLocale()
  const [category, setCategory] = useState<typeof categories[number]>('all')
  const [bagOpen, setBagOpen] = useState(false)
  const { count } = useStoreBag()
  const [featured, setFeatured] = useState<StoreCategory>('wear')
  const products = STORE_PRODUCTS.filter((product) => category === 'all' || product.category === category)
  const money = (amount: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
  const label = (product: StoreProduct) => product.units > 1 ? `${product.name} · ${t('store.pair')}` : product.name
  const selectCategory = (value: typeof categories[number]) => {
    setCategory(value)
    document.getElementById('store-collections')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  }

  return <PageShell seo={{ title: t('store.title'), description: t('store.description'), canonicalPath: '/store/' }} mainClassName="min-w-0 flex-1">
    <div className="bg-secondary px-4 py-2 text-center text-xs text-secondary-foreground sm:px-6">{t('store.demo')}</div>
    <section className="flex min-h-48 items-start justify-between gap-6 px-4 pb-12 pt-8 sm:px-6 lg:min-h-60 lg:px-8">
      <h1 className="text-2xl font-medium tracking-tight">The Oxy Store</h1>
      <Button appearance="subtle" onPress={() => setBagOpen(true)}>{t('store.bag')} [{count}]</Button>
    </section>
    <nav id="store-collections" aria-label={t('store.collections')} className="sticky top-(--site-header-occlusion-bottom) z-20 scroll-mt-(--site-header-occlusion-bottom) bg-background py-2">
      <div className="flex w-full gap-7 overflow-x-auto overflow-y-hidden px-4 sm:px-6 lg:px-8">
        {categories.map((value) => <button key={value} type="button" aria-pressed={category === value} onClick={() => selectCategory(value)} className="min-h-11 shrink-0 cursor-pointer text-sm whitespace-nowrap hover:italic focus-visible:italic focus-visible:outline-2 focus-visible:outline-ring aria-pressed:underline aria-pressed:underline-offset-4">{t(`store.${value}`)}</button>)}
      </div>
    </nav>
    <section aria-label={t('store.collections')} className="px-4 pb-28 pt-3 sm:px-6 lg:px-8">
      <div data-store-grid className="flex w-full flex-wrap gap-x-(--layout-gap) gap-y-12 [--image-height:15rem] [--layout-gap:1rem] xl:[--image-height:18.75rem]">
        {products.map((product, index) => <Link key={product.id} to={`/store/p/${product.id}/`} data-store-product={product.id} className={`group/product-card flex min-w-0 cursor-pointer flex-col gap-2 text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${shapes[index % shapes.length]}`}>
          <div className={`relative w-full overflow-hidden bg-muted lg:aspect-auto lg:h-(--image-height) ${aspects[index % aspects.length]}`}>
            <StoreProductImage product={product} eager={index < 6} />
            <div className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors duration-150 group-hover/product-card:bg-foreground/5 group-focus-visible/product-card:bg-foreground/5 motion-reduce:transition-none" />
          </div>
          <div className="flex w-full flex-col text-xs leading-relaxed">
            <h2 className="truncate font-normal group-hover/product-card:italic group-focus-visible/product-card:italic">{label(product)}</h2>
            <p>{money(product.price)} <span className="text-muted-foreground">· {t('store.sample')}</span></p>
          </div>
        </Link>)}
      </div>
    </section>
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <div className="max-w-xs space-y-4 text-sm leading-relaxed">
        <h2 className="font-normal">{t('store.about')}</h2>
        <Link to="/company/" className="inline-flex min-h-11 items-center text-xs uppercase hover:italic focus-visible:underline">{t('store.learn')}</Link>
      </div>
    </section>
    <section className="px-4 pb-16 sm:px-6 lg:px-8" aria-label={t('store.featured')}>
      <div className="grid gap-4 lg:grid-cols-4">
        <h2 className="py-3 text-sm font-normal">{t('store.featured')}</h2>
        {(['wear', 'desk', 'drink'] as const).map((value) => <button key={value} type="button" onMouseEnter={() => setFeatured(value)} onFocus={() => setFeatured(value)} onClick={() => selectCategory(value)} className="min-h-11 cursor-pointer text-start text-xs uppercase hover:italic focus-visible:underline">[{STORE_PRODUCTS.filter((product) => product.category === value).length}] {t(`store.${value}`)}</button>)}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:ml-[25%] lg:grid-cols-4">
        {STORE_PRODUCTS.filter((product) => product.category === featured).map((product) => <Link key={product.id} to={`/store/p/${product.id}/`} aria-label={label(product)} className="aspect-[4/5] cursor-pointer overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-ring"><StoreProductImage product={product} /></Link>)}
      </div>
    </section>
    <StoreBag open={bagOpen} onClose={() => setBagOpen(false)} />
  </PageShell>
}
