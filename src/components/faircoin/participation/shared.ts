import { fc } from '../../../lib/faircoin-links';
import { DEFAULT_LOCALE, useTranslation } from '../../../lib/i18n';

export const PARTICIPATION_GUTTER = 'px-4 lg:px-[max(20px,calc((100%_-_1440px)/2))]';
export const PARTICIPATION_TITLE =
  'max-w-5xl text-balance text-[clamp(40px,6vw,88px)] font-normal leading-[1.04] tracking-[-.03em]';
export const PARTICIPATION_COPY = 'text-pretty text-lg leading-relaxed lg:text-xl';

/** Retain the current language while resolving the two FairCoin hosts. */
export function useParticipationHref() {
  const { locale } = useTranslation();
  return (path: string) => `${locale === DEFAULT_LOCALE ? '' : `/${locale}`}${fc(path)}`;
}
