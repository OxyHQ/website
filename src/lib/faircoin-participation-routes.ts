import { SUPPORTED_LOCALES } from './i18n/types';

export const FAIRCOIN_PARTICIPATION_PAGES = ['participate', 'pilot'] as const;
export type FaircoinParticipationPage = (typeof FAIRCOIN_PARTICIPATION_PAGES)[number];

/** Only the approved editorial pages have a shared static document on both hosts. */
export function faircoinParticipationRoute(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const locale = SUPPORTED_LOCALES.find((code) => code === segments[0]);
  if (locale) segments.shift();
  if (segments[0] === 'faircoin') segments.shift();
  const page = FAIRCOIN_PARTICIPATION_PAGES.find((name) => name === segments[0]);
  if (!page || segments.length !== 1) return null;
  const prefix = locale ? `/${locale}` : '';
  return { page, locale, document: `${prefix}/faircoin/${page}/`, apex: `${prefix}/${page}/` };
}

/** Keep the locale when exposing a FairCoin document on its own host. */
export function faircoinApexHref(href: string): string | null {
  const url = new URL(href, 'https://oxy.so');
  if (url.origin !== 'https://oxy.so') return null;
  const segments = url.pathname.split('/').filter(Boolean);
  const locale = SUPPORTED_LOCALES.find((code) => code === segments[0]);
  if (locale) segments.shift();
  if (segments.shift() !== 'faircoin') return null;
  return `${locale ? `/${locale}` : ''}/${segments.length ? `${segments.join('/')}/` : ''}${url.search}${url.hash}`;
}
