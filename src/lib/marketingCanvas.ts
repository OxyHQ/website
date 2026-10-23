import { SUPPORTED_LOCALES } from './i18n/types';

/** The same opening surface survives static HTML, a lazy route, and its mounted scene. */
export function marketingCanvasClass(pathname: string, faircoinHost = false): string {
  const segments = pathname.split('/').filter(Boolean);
  if (SUPPORTED_LOCALES.some((locale) => locale === segments[0])) segments.shift();
  const path = `/${segments.join('/')}`;
  if (
    path === '/faircoin' ||
    path === '/faircoin/wallet' ||
    path === '/faircoin/buy' ||
    (faircoinHost && (path === '/' || path === '/wallet' || path === '/buy'))
  ) {
    return 'faircoin-editorial bg-card';
  }
  return path === '/horizon' ? 'oxy-ecosystem bg-background' : '';
}
