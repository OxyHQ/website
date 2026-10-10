import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@oxy.so/bloom/button';
import PageShell from '../components/layout/PageShell';
import Navbar from '../components/layout/Navbar';
import StoreProductImage from '../components/store/StoreProductImage';
import StoreBag from '../components/store/StoreBag';
import StoreHeader from '../components/store/StoreHeader';
import { MentionHeartIcon } from '../components/store/MentionActionIcons';
import { useStoreCatalog, useStoreCollection } from '../components/store/useStoreCatalog';
import StoreLoadState from '../components/store/StoreLoadState';
import { formatStorePrice } from '../lib/mercaria-store';
import { useStoreBag } from '../components/store/useStoreBag';
import { type StoreCategory, type StoreProduct } from '../data/store';
import { useCurrentLocale, useTranslation } from '../lib/i18n';
import { Link } from '../lib/navigation';

const categories = ['all', 'wear', 'carry', 'desk', 'drink'] as const;
// Same portrait / square / landscape rhythm as the supplied Tailwind template.
const shapes = [
  'w-[calc(44.44%-var(--layout-gap)/2)] md:w-[calc(26.23%-var(--layout-gap)*2/3)] lg:w-[calc(var(--image-height)*.8)]',
  'w-[calc(55.56%-var(--layout-gap)/2)] md:w-[calc(32.79%-var(--layout-gap)*2/3)] lg:w-(--image-height)',
  'w-[calc(60.98%-var(--layout-gap)/2)] md:w-[calc(40.98%-var(--layout-gap)*2/3)] lg:w-[calc(var(--image-height)*1.25)]',
  'w-[calc(39.02%-var(--layout-gap)/2)] md:w-[calc(28.07%-var(--layout-gap)*2/3)] lg:w-[calc(var(--image-height)*.8)]',
  'w-[calc(39.02%-var(--layout-gap)/2)] md:w-[calc(28.07%-var(--layout-gap)*2/3)] lg:w-[calc(var(--image-height)*.8)]',
  'w-[calc(60.98%-var(--layout-gap)/2)] md:w-[calc(43.86%-var(--layout-gap)*2/3)] lg:w-[calc(var(--image-height)*1.25)]',
];
const aspects = [
  'aspect-[4/5]',
  'aspect-square',
  'aspect-[5/4]',
  'aspect-[4/5]',
  'aspect-[4/5]',
  'aspect-[5/4]',
];

export default function StorePage() {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const [category, setCategory] = useState<string>('all');
  const [bagOpen, setBagOpen] = useState(false);
  const { count, saved, toggleSaved } = useStoreBag();
  const [searchParams, setSearchParams] = useSearchParams();
  const showFavorites = searchParams.get('view') === 'favorites';
  const [featured, setFeatured] = useState<StoreCategory>('wear');
  const catalog = useStoreCatalog();
  const collection = useStoreCollection(category);
  const allProducts = catalog.products;
  const source =
    catalog.live && category !== 'all' && !showFavorites ? (collection.data ?? []) : allProducts;
  const products = source.filter((product) =>
    showFavorites
      ? saved.includes(product.id)
      : catalog.live || category === 'all' || product.category === category,
  );
  const money = (product: StoreProduct) =>
    formatStorePrice(product.price, product.currency ?? 'EUR', locale);
  const label = (product: StoreProduct) =>
    product.units > 1 ? `${product.name} · ${t('store.pair')}` : product.name;
  const selectCategory = (value: string) => {
    if (showFavorites)
      setSearchParams((params) => {
        params.delete('view');
        return params;
      });
    setCategory(value);
    document.getElementById('store-collections')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
  };

  return (
    <PageShell
      navbar={
        <Navbar
          bannerContent={catalog.live ? t('storeLive.announcement') : t('store.announcement')}
        />
      }
      seo={{
        title: t('store.title'),
        description: t('store.description'),
        canonicalPath: '/store/',
      }}
      mainClassName="min-w-0 flex-1"
    >
      <StoreHeader count={count} onOpenBag={() => setBagOpen(true)} />
      <nav
        id="store-collections"
        aria-label={t('store.collections')}
        className="sticky top-(--site-header-occlusion-bottom) z-20 scroll-mt-(--site-header-occlusion-bottom) bg-background py-2"
      >
        <div className="container flex gap-7 overflow-x-auto overflow-y-hidden">
          {(catalog.live
            ? ['all', ...(catalog.data?.collections.map((item) => item.ref.id) ?? [])]
            : categories
          ).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={!showFavorites && category === value}
              onClick={() => selectCategory(value)}
              className="min-h-11 shrink-0 cursor-pointer text-sm whitespace-nowrap hover:italic focus-visible:italic focus-visible:outline-2 focus-visible:outline-ring aria-pressed:underline aria-pressed:underline-offset-4"
            >
              {catalog.live && value !== 'all'
                ? catalog.data?.collections.find((item) => item.ref.id === value)?.title
                : t(`store.${value as (typeof categories)[number]}`)}
            </button>
          ))}
        </div>
      </nav>
      {catalog.live && (
        <StoreLoadState
          pending={
            catalog.isPending || (category !== 'all' && !showFavorites && collection.isPending)
          }
          error={catalog.error || (category !== 'all' && !showFavorites ? collection.error : null)}
          onRetry={() => {
            void catalog.refetch();
            if (category !== 'all') void collection.refetch();
          }}
          empty={
            catalog.isSuccess &&
            products.length === 0 &&
            !showFavorites &&
            (category === 'all' || collection.isSuccess)
          }
        />
      )}
      <section
        aria-label={showFavorites ? t('storeFavorites.title') : t('store.collections')}
        className="container pb-28 pt-3"
      >
        {showFavorites && (
          <div className="mb-6 space-y-2">
            <h2 className="text-lg font-medium">
              {t('storeFavorites.title')} [{saved.length}]
            </h2>
            <p className="text-sm text-muted-foreground">{t('storeFavorites.hint')}</p>
          </div>
        )}
        {showFavorites && products.length === 0 && (
          <div className="flex flex-col items-start gap-4 py-10">
            <p className="text-muted-foreground">{t('storeFavorites.empty')}</p>
            <Button appearance="subtle" onPress={() => selectCategory('all')}>
              {t('store.all')}
            </Button>
          </div>
        )}
        <div
          data-store-grid
          className="flex w-full flex-wrap gap-x-(--layout-gap) gap-y-12 [--image-height:15rem] [--layout-gap:1rem] xl:[--image-height:18.75rem]"
        >
          {products.map((product, index) => (
            <div key={product.id} className={`relative min-w-0 ${shapes[index % shapes.length]}`}>
              <Link
                to={`/store/p/${encodeURIComponent(product.id)}/`}
                data-store-product={product.id}
                className="group/product-card flex cursor-pointer flex-col gap-2 text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <div
                  className={`relative w-full overflow-hidden bg-muted lg:aspect-auto lg:h-(--image-height) ${aspects[index % aspects.length]}`}
                >
                  <StoreProductImage product={product} eager={index < 6} />
                  <div className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors duration-150 group-hover/product-card:bg-foreground/5 group-focus-visible/product-card:bg-foreground/5 motion-reduce:transition-none" />
                </div>
                <div className="flex w-full flex-col text-xs leading-relaxed">
                  <h2 className="truncate font-normal group-hover/product-card:italic group-focus-visible/product-card:italic">
                    {label(product)}
                  </h2>
                  <p>
                    {money(product)}{' '}
                    {!catalog.live && (
                      <span className="text-muted-foreground">· {t('store.sample')}</span>
                    )}
                  </p>
                </div>
              </Link>
              {showFavorites && (
                <div className="absolute end-2 top-2 rounded-full bg-background">
                  <Button
                    appearance="plain"
                    iconOnly
                    accessibilityLabel={`${t('storeFavorites.remove')}: ${label(product)}`}
                    onPress={() => toggleSaved(product.id)}
                  >
                    <MentionHeartIcon active />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      {!showFavorites && !catalog.live && (
        <>
          <section className="container pb-24">
            <div className="max-w-xs space-y-4 text-sm leading-relaxed">
              <h2 className="font-normal">{t('store.about')}</h2>
              <Link
                to="/company/"
                className="inline-flex min-h-11 items-center text-xs uppercase hover:italic focus-visible:underline"
              >
                {t('store.learn')}
              </Link>
            </div>
          </section>
          <section className="container pb-16" aria-label={t('store.featured')}>
            <div className="grid gap-4 lg:grid-cols-4">
              <h2 className="py-3 text-sm font-normal">{t('store.featured')}</h2>
              {(['wear', 'desk', 'drink'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onMouseEnter={() => setFeatured(value)}
                  onFocus={() => setFeatured(value)}
                  onClick={() => selectCategory(value)}
                  className="min-h-11 cursor-pointer text-start text-xs uppercase hover:italic focus-visible:underline"
                >
                  [{allProducts.filter((product) => product.category === value).length}]{' '}
                  {t(`store.${value}`)}
                </button>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:ml-[25%] lg:grid-cols-4">
              {allProducts
                .filter((product) => product.category === featured)
                .map((product) => (
                  <Link
                    key={product.id}
                    to={`/store/p/${encodeURIComponent(product.id)}/`}
                    aria-label={label(product)}
                    className="aspect-[4/5] cursor-pointer overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <StoreProductImage product={product} />
                  </Link>
                ))}
            </div>
          </section>
        </>
      )}
      <StoreBag open={bagOpen} onClose={() => setBagOpen(false)} />
    </PageShell>
  );
}
