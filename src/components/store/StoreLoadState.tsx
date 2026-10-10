import { Button } from '@oxy.so/bloom/button';
import { useTranslation } from '../../lib/i18n';

export default function StoreLoadState({
  pending,
  error,
  empty,
  onRetry,
}: {
  pending: boolean;
  error: unknown;
  empty?: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  if (!pending && !error && !empty) return null;
  return (
    <div className="container space-y-4 py-10" role={error ? 'alert' : 'status'}>
      <p>{t(error ? 'storeLive.error' : pending ? 'storeLive.loading' : 'storeLive.empty')}</p>
      {!!error && (
        <Button appearance="outline" onPress={onRetry}>
          {t('storeLive.retry')}
        </Button>
      )}
    </div>
  );
}
