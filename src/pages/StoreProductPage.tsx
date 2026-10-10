import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@oxy.so/bloom/button';
import { Dialog } from '@oxy.so/bloom/dialog';
import { RiArrowLeftLine } from '@oxy.so/bloom/icons/RiArrowLeftLine';
import { RiArrowRightLine } from '@oxy.so/bloom/icons/RiArrowRightLine';
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine';
import { MentionHeartIcon, MentionShareIcon } from '../components/store/MentionActionIcons';
import PageShell from '../components/layout/PageShell';
import Navbar from '../components/layout/Navbar';
import StoreBag from '../components/store/StoreBag';
import StoreHeader from '../components/store/StoreHeader';
import StoreProductImage from '../components/store/StoreProductImage';
import { productGallery } from '../components/store/product-gallery';
import { useStoreBag } from '../components/store/useStoreBag';
import { FaqList } from '../components/sections/FaqSection';
import { type StoreProduct } from '../data/store';
import { useCurrentLocale, useTranslation } from '../lib/i18n';
import { Link } from '../lib/navigation';
import { useCopyToClipboard } from '../lib/useCopyToClipboard';
import { MercariaGoneError, MercariaNotFoundError } from '@mercaria.co/sdk';
import { currencyDecimals, formatStorePrice } from '../lib/mercaria-store';
import { useStoreCatalog, useStoreProduct } from '../components/store/useStoreCatalog';
import StoreLoadState from '../components/store/StoreLoadState';
import NotFoundPage from './NotFoundPage';

export default function StoreProductPage() {
  const { id } = useParams<{ id: string }>();
  const catalog = useStoreCatalog();
  const query = useStoreProduct(id);
  const { t } = useTranslation();
  const [bagOpen, setBagOpen] = useState(false);
  if (catalog.live && (query.isPending || query.error)) {
    if (query.error instanceof MercariaNotFoundError || query.error instanceof MercariaGoneError)
      return <NotFoundPage />;
    return (
      <PageShell
        navbar={<Navbar bannerContent={t('storeLive.announcement')} />}
        seo={{
          title: t('store.title'),
          description: t('store.description'),
          canonicalPath: `/store/p/${encodeURIComponent(id ?? '')}/`,
          noIndex: true,
        }}
      >
        <StoreHeader count={0} onOpenBag={() => setBagOpen(true)} />
        <StoreLoadState
          pending={query.isPending}
          error={query.error}
          onRetry={() => void query.refetch()}
        />
        <StoreBag open={bagOpen} onClose={() => setBagOpen(false)} />
      </PageShell>
    );
  }
  const product = catalog.live ? query.data : catalog.products.find((item) => item.id === id);
  return product ? <ProductDetail key={product.id} product={product} /> : <NotFoundPage />;
}

function ProductDetail({ product }: { product: StoreProduct }) {
  const { t } = useTranslation();
  const locale = useCurrentLocale();
  const { count, saved, addItem, toggleSaved } = useStoreBag();
  const { copy } = useCopyToClipboard();
  const [bagOpen, setBagOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [purchaseVisible, setPurchaseVisible] = useState(true);
  const purchaseRef = useRef<HTMLDivElement>(null);
  const catalog = useStoreCatalog();
  const [selectedOption, setSelectedOption] = useState(
    product.mercaria?.options?.[0]?.ref.variantId,
  );
  const option = product.mercaria?.options?.find((item) => item.ref.variantId === selectedOption);
  const livePrice = option
    ? option.price.amount / 10 ** currencyDecimals(option.price.currency)
    : product.price;
  const variants = catalog.products.filter((item) => item.name === product.name);
  const related = catalog.products
    .filter((item) => item.name !== product.name && item.units === 1)
    .slice(0, 3);
  const money = (amount: number) =>
    formatStorePrice(amount, option?.price.currency ?? product.currency ?? 'EUR', locale);
  const format = (item: StoreProduct) =>
    item.units > 1 ? t('store.pair') : t('storeProduct.single');
  const name = product.units > 1 ? `${product.name} · ${t('store.pair')}` : product.name;
  const isSaved = saved.includes(product.id);
  // The second view is a labelled detail crop of the same photograph, never an invented angle or colour.
  const images = productGallery(product);
  const imageLabel = (index: number) =>
    `${images[index].alt}${images[index].detail ? ` · ${t('storeProduct.details')}` : ''}`;

  useEffect(() => {
    const node = purchaseRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) =>
      setPurchaseVisible(entry.isIntersecting),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const addToBag = () => {
    addItem(product.id);
    setBagOpen(true);
  };
  const openImage = (index: number) => {
    setZoomed(false);
    setImageIndex(index);
  };
  const stepImage = (step: number) => {
    setZoomed(false);
    setImageIndex((current) =>
      current === null ? null : (current + step + images.length) % images.length,
    );
  };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    await copy(url, t('common.linkCopied'));
  };

  return (
    <PageShell
      navbar={
        <Navbar
          bannerContent={product.mercaria ? t('storeLive.announcement') : t('store.announcement')}
        />
      }
      seo={{
        title: name,
        description: product.mercaria?.description || t('store.description'),
        canonicalPath: `/store/p/${encodeURIComponent(product.id)}/`,
        ogImage: product.image,
      }}
      mainClassName="min-w-0 flex-1 pb-20 lg:pb-0"
    >
      <StoreHeader count={count} onOpenBag={() => setBagOpen(true)} />

      <section
        className="flex flex-col gap-8 px-4 pb-20 sm:px-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8 lg:px-8"
        aria-labelledby="store-product-title"
      >
        <div className="contents lg:sticky lg:top-[calc(var(--site-header-occlusion-bottom)+32px)] lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:ms-[max(0px,calc((100vw-var(--layout-max-width))/2+var(--layout-gutter)-2rem))] lg:max-w-[calc((min(100vw,var(--layout-max-width))-2*var(--layout-gutter))/3)] lg:flex lg:flex-col lg:gap-10">
          <header className="order-1 space-y-5 pt-2 lg:pt-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <h2
                  id="store-product-title"
                  className="text-xl font-normal leading-snug sm:text-2xl"
                >
                  {name}
                </h2>
                <p className="text-sm">
                  {money(livePrice)}{' '}
                  {!product.mercaria && (
                    <span className="text-muted-foreground">· {t('store.sample')}</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  appearance="plain"
                  accessibilityLabel={t('storeProduct.share')}
                  onPress={() => void share()}
                  iconOnly
                >
                  <MentionShareIcon />
                </Button>
                <Button
                  appearance={isSaved ? 'subtle' : 'plain'}
                  accessibilityLabel={isSaved ? t('storeProduct.saved') : t('storeProduct.save')}
                  pressed={isSaved}
                  onPress={() => toggleSaved(product.id)}
                  iconOnly
                >
                  <MentionHeartIcon active={isSaved} />
                </Button>
              </div>
            </div>
          </header>

          <div className="order-3 flex min-w-0 flex-col gap-8 lg:gap-10">
            <p className="max-w-md text-sm leading-relaxed">
              {product.mercaria?.description ?? t('store.about')}
            </p>
            {!product.mercaria && (
              <fieldset>
                <legend className="mb-3 text-xs">
                  {t('storeProduct.format')}: <span>{format(product)}</span>
                </legend>
                <div className="grid max-w-xs grid-cols-6 gap-2">
                  {variants.map((variant) => (
                    <Link
                      key={variant.id}
                      to={`/store/p/${encodeURIComponent(variant.id)}/`}
                      aria-label={`${format(variant)} · ${money(variant.price)}`}
                      aria-current={variant.id === product.id ? 'page' : undefined}
                      className="flex min-w-0 flex-col gap-1 text-center text-xs outline-offset-2 aria-[current=page]:outline aria-[current=page]:outline-1 aria-[current=page]:outline-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <span className="aspect-square overflow-hidden bg-muted">
                        <StoreProductImage product={variant} />
                      </span>
                      <span>{variant.units}</span>
                    </Link>
                  ))}
                </div>
              </fieldset>
            )}
            {product.mercaria?.options && (
              <fieldset>
                <legend className="mb-3 text-xs">{t('storeProduct.format')}</legend>
                <div className="flex flex-wrap gap-2">
                  {product.mercaria.options.map((item) => (
                    <Button
                      key={item.ref.variantId}
                      appearance={item.ref.variantId === selectedOption ? 'solid' : 'outline'}
                      pressed={item.ref.variantId === selectedOption}
                      onPress={() => setSelectedOption(item.ref.variantId)}
                    >
                      {item.title}
                    </Button>
                  ))}
                </div>
              </fieldset>
            )}
            <div ref={purchaseRef} data-store-purchase>
              {product.mercaria ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t(`storeLive.${option?.availability ?? product.mercaria.availability}`)}
                  </p>
                  <a
                    href={product.mercaria.url}
                    className="flex min-h-12 items-center justify-center bg-foreground px-4 text-sm text-background focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {t('storeLive.view')}
                  </a>
                </div>
              ) : (
                <Button onPress={addToBag} className="w-full !min-h-12">
                  {t('store.add')}
                </Button>
              )}
            </div>
            <FaqList
              idPrefix={`product-${product.id}`}
              type="multiple"
              questionClassName="text-sm font-normal text-foreground"
              answerClassName="pb-4 text-xs leading-relaxed text-muted-foreground"
              items={[
                {
                  question: t('storeProduct.details'),
                  answer: (
                    <dl className="divide-y divide-border">
                      {[
                        [t('store.collections'), t(`store.${product.category}`)],
                        [t('storeProduct.format'), format(product)],
                        [t('storeProduct.price'), money(livePrice)],
                      ].map(([term, value]) => (
                        <div key={term} className="grid grid-cols-2 gap-4 py-3">
                          <dt>{term}</dt>
                          <dd className="text-foreground">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ),
                },
                {
                  question: t('storeProduct.shipping'),
                  answer: product.mercaria
                    ? t('storeLive.announcement')
                    : t('storeProduct.shippingBody'),
                },
              ]}
            />
            <section aria-labelledby="store-product-related">
              <h2 id="store-product-related" className="mb-4 text-sm font-normal">
                {t('storeProduct.related')}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    to={`/store/p/${encodeURIComponent(item.id)}/`}
                    className="group min-w-0 text-xs leading-relaxed"
                  >
                    <div className="mb-2 aspect-[4/5] overflow-hidden bg-muted">
                      <StoreProductImage product={item} />
                    </div>
                    <h3 className="font-normal group-hover:italic">{item.name}</h3>
                    <p className="mt-1 text-muted-foreground">
                      {formatStorePrice(item.price, item.currency ?? 'EUR', locale)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div
          className="order-2 grid min-w-0 grid-cols-6 gap-3 lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:grid-cols-5 lg:gap-4"
          role="group"
          aria-label={t('storeProduct.gallery')}
        >
          {images.map((image, index) => (
            <button
              key={`${image.src}-${index}`}
              type="button"
              onClick={() => openImage(index)}
              aria-label={`${t('storeProduct.zoom')}: ${imageLabel(index)}`}
              className="relative col-span-6 aspect-[4/5] cursor-zoom-in overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:col-span-5"
            >
              <img
                src={image.src}
                alt={imageLabel(index)}
                width={1024}
                height={1280}
                fetchPriority={index === 0 ? 'high' : undefined}
                loading={index === 0 ? 'eager' : 'lazy'}
                className={`size-full object-cover ${image.detail ? 'scale-[1.65]' : ''}`}
              />
              {image.detail && (
                <span className="absolute bottom-3 start-3 bg-background/90 px-2 py-1 text-xs text-foreground">
                  {t('storeProduct.details')}
                </span>
              )}
            </button>
          ))}
          {images.map((image, index) => (
            <button
              key={`thumb-${index}`}
              type="button"
              onClick={() => openImage(index)}
              aria-label={t('storeProduct.viewImage', { number: index + 1 })}
              className="aspect-[4/5] cursor-zoom-in overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <img
                src={image.src}
                alt=""
                width={1024}
                height={1280}
                loading="lazy"
                className={`size-full object-cover ${image.detail ? 'scale-[1.65]' : ''}`}
              />
            </button>
          ))}
        </div>
      </section>

      {!product.mercaria && !purchaseVisible && !bagOpen && imageIndex === null && (
        <div
          data-store-floating-purchase
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-border bg-background px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-sm lg:hidden"
        >
          <div className="min-w-0 text-xs">
            <p className="truncate">{name}</p>
            <p className="mt-1">{money(livePrice)}</p>
          </div>
          <Button onPress={addToBag} className="shrink-0 !min-h-11">
            {t('store.add')}
          </Button>
        </div>
      )}

      <StoreBag open={bagOpen} onClose={() => setBagOpen(false)} />
      <Dialog
        open={imageIndex !== null}
        onClose={() => setImageIndex(null)}
        label={t('storeProduct.gallery')}
        presentation="custom"
        maxWidth={10000}
        scrollable={false}
        contentPadding={0}
        morph={false}
        style={{ width: '100%', height: '100%' }}
      >
        {imageIndex !== null && (
          <div
            className="relative flex h-dvh w-full flex-col bg-background text-foreground"
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                stepImage(-1);
              }
              if (event.key === 'ArrowRight') {
                event.preventDefault();
                stepImage(1);
              }
            }}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <Button
                appearance="plain"
                accessibilityLabel={t('common.close')}
                onPress={() => setImageIndex(null)}
                iconOnly
              >
                <RiCloseLine width={24} height={24} fill="currentColor" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xs tabular-nums" aria-live="polite">
                  {imageIndex + 1} / {images.length}
                </span>
                <Button
                  appearance="plain"
                  accessibilityLabel={t('storeProduct.previous')}
                  onPress={() => stepImage(-1)}
                  iconOnly
                >
                  <RiArrowLeftLine width={24} height={24} fill="currentColor" />
                </Button>
                <Button
                  appearance="plain"
                  accessibilityLabel={t('storeProduct.next')}
                  onPress={() => stepImage(1)}
                  iconOnly
                >
                  <RiArrowRightLine width={24} height={24} fill="currentColor" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <button
                type="button"
                aria-label={zoomed ? t('storeProduct.zoomOut') : t('storeProduct.zoomIn')}
                aria-pressed={zoomed}
                onClick={() => setZoomed((value) => !value)}
                className={`block overflow-hidden p-4 ${zoomed ? 'h-[200%] w-[200%] cursor-zoom-out' : 'size-full cursor-zoom-in'}`}
              >
                <img
                  src={images[imageIndex].src}
                  alt={imageLabel(imageIndex)}
                  className={`size-full object-contain ${images[imageIndex].detail ? 'scale-[1.65]' : ''}`}
                />
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </PageShell>
  );
}
