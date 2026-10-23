import type { LocaleDict } from '../src/lib/i18n/types';

/** Only routes whose mounted page reads these same dictionary keys belong here.
 * Keep CMS product data and untranslated editorial pages out of this mapping. */
const COPY_KEYS: Record<string, readonly [string, string]> = {
  '/': ['home.seoTitle', 'home.seoDescription'],
  '/pricing': ['pricingHub.seoTitle', 'pricingHub.description'],
  '/one': ['pricing.seoTitle', 'one.lead'],
  '/store': ['store.title', 'store.description'],
  '/company': ['company.seoTitle', 'company.seoDescription'],
  '/enterprise': ['enterprisePage.seoTitle', 'enterprisePage.seoDescription'],
  '/help': ['help.seoTitle', 'help.seoDescription'],
};

export function localizedSeoCopy(
  canonicalPath: string,
  dictionary: LocaleDict,
): { title: string; description: string } | null {
  const keys = COPY_KEYS[canonicalPath.replace(/\/+$/, '') || '/'];
  if (!keys) return null;
  const read = (key: string): string => {
    let value: unknown = dictionary;
    for (const part of key.split('.')) {
      value =
        value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined;
    }
    if (typeof value !== 'string' || !value.trim())
      throw new Error(`Missing SEO translation: ${key}`);
    return value;
  };
  return { title: read(keys[0]), description: read(keys[1]) };
}
