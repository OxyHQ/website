import { Dialog } from '@oxy.so/bloom/dialog'
import { Button } from '@oxy.so/bloom/button'
import { CartPanel } from '@oxy.so/bloom/cart-panel'
import { LocaleProvider as BloomLocaleProvider } from '@oxy.so/bloom/locale'
import { STORE_PRODUCTS } from '../../data/store'
import { useCurrentLocale, useTranslation } from '../../lib/i18n'
import { useNavigate } from '../../lib/navigation'
import { useStoreBag } from './useStoreBag'

/** Bloom's native cart content inside its right-hand drawer; this preview has no checkout. */
export default function StoreBag({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const locale = useCurrentLocale()
  const navigate = useNavigate()
  const { quantities, count, total, setQuantity } = useStoreBag()
  const money = (amount: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount)
  const lines = STORE_PRODUCTS.filter(product => quantities[product.id]).map(product => ({
    id: product.id,
    name: product.name,
    options: [product.units > 1 ? t('store.pair') : t('storeProduct.single')],
    quantity: quantities[product.id],
    price: money(product.price * quantities[product.id]),
    photo: product.image,
  }))

  return <BloomLocaleProvider locale={locale}>
    <Dialog
      open={open}
      onClose={onClose}
      placement="right"
      width={560}
      label={t('store.bag')}
      contentPadding={0}
      panelStyle={{ borderRadius: 0 }}
      testID="store-bag-drawer"
    >
      <div className="relative space-y-6 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-medium">{t('store.bag')} [{count}]</h2>
          <Button appearance="subtle" onPress={onClose}>{t('common.close')}</Button>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('store.demo')}</p>
        <CartPanel
          vendorName={t('store.title')}
          vendorPhoto="/logo-mark.svg"
          onPressVendor={() => { onClose(); navigate('/store/') }}
          lines={lines}
          onLineQuantityChange={setQuantity}
          onLineRemove={id => setQuantity(id, 0)}
          removeInStepper
          summary={{ lines: [], total: { label: t('store.total'), amount: money(total) } }}
          emptyTitle={t('store.empty')}
          emptyDescription={t('storeProduct.continue')}
          accessibilityLabel={t('store.bag')}
          density="compact"
          testID="store-cart"
        />
        <Button appearance="outline" onPress={onClose}>{t('storeProduct.continue')}</Button>
      </div>
    </Dialog>
  </BloomLocaleProvider>
}
