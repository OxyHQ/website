import { Button } from '@oxy.so/bloom/button'
import { useTranslation } from '../../lib/i18n'
import { Link } from '../../lib/navigation'
import { useSearchParams } from 'react-router-dom'
import { MentionHeartIcon } from './MentionActionIcons'
import { useStoreBag } from './useStoreBag'

/** The same store title and bag action on the collection and product pages. */
export default function StoreHeader({ count, onOpenBag }: { count: number; onOpenBag: () => void }) {
  const { t } = useTranslation()
  const { saved } = useStoreBag()
  const [searchParams] = useSearchParams()
  return <header className="container flex items-center justify-between gap-2 py-6" data-store-header>
    <h1 className="text-xl font-medium tracking-tight sm:text-2xl">
      <Link to="/store/" className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{t('store.title')}</Link>
    </h1>
    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
      <Link to="/store/?view=favorites" aria-label={`${t('storeFavorites.title')} [${saved.length}]`} aria-current={searchParams.get('view') === 'favorites' ? 'page' : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <MentionHeartIcon active={searchParams.get('view') === 'favorites'} />
        <span className="hidden sm:inline">{t('storeFavorites.title')}</span>
        <span aria-hidden="true">[{saved.length}]</span>
      </Link>
      <Button appearance="subtle" onPress={onOpenBag}>{t('store.bag')} [{count}]</Button>
    </div>
  </header>
}
