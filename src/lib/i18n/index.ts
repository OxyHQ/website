/* Barrel for the website i18n layer. */

export { LocaleProvider, OXY_LOCALE_STORAGE_KEY } from './locale-context'
export { useLocaleContext, useCurrentLocale, useTranslation } from './use-translation'
export { LocaleContext, type LocaleContextValue } from './context'
export {
  DEFAULT_LOCALE,
  LOCALE_DISPLAY,
  RTL_LOCALES,
  SUPPORTED_LOCALES,
  isRtlLocale,
} from './types'
export type {
  Locale,
  LocaleDict,
  LocaleNode,
  LocaleDisplayMeta,
  TranslateFn,
  TranslationVars,
} from './types'
