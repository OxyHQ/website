import {
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@oxy.so/services/ui/client';
import { useTranslation } from './i18n';

const AskAliaSheet = lazy(() => import('../components/ai/AskAliaSheet'));

interface AskAliaContextValue {
  /**
   * Opens Alia's chat sheet. Signed out, there is no session to call Alia with, so this opens
   * the Oxy sign-in dialog instead.
   */
  open: () => void;
}

const AskAliaContext = createContext<AskAliaContextValue | null>(null);

export function useAskAlia(): AskAliaContextValue {
  const value = useContext(AskAliaContext);
  if (!value) throw new Error('useAskAlia must be used within an AskAliaProvider');
  return value;
}

/**
 * Owns the one `AliaChatSheet` and the way to open it. The sheet mounts after the first press, so
 * the Alia SDK stays out of the entry chunk. Must sit inside `OxyProvider` (auth), the router and
 * the locale provider.
 */
export function AskAliaProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { isAuthenticated, signIn } = useAuth();
  const [askId, setAskId] = useState(0);

  const open = useCallback(() => {
    if (isAuthenticated) setAskId((id) => id + 1);
    else void signIn().catch(() => undefined);
  }, [isAuthenticated, signIn]);

  const value = useMemo(() => ({ open }), [open]);
  const welcomeSuggestions = useMemo(
    () => [
      { id: 'products', text: t('askAlia.suggestions.products') },
      { id: 'developers', text: t('askAlia.suggestions.developers') },
      { id: 'apps', text: t('askAlia.suggestions.apps') },
    ],
    [t],
  );
  const clientContext = `${t('askAlia.clientContext')} ${pathname}`;

  return (
    <AskAliaContext.Provider value={value}>
      {children}
      {isAuthenticated && askId > 0 ? (
        <Suspense fallback={null}>
          <AskAliaSheet
            askId={askId}
            clientContext={clientContext}
            welcomeSuggestions={welcomeSuggestions}
          />
        </Suspense>
      ) : null}
    </AskAliaContext.Provider>
  );
}
