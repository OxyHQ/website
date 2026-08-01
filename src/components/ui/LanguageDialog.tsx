import { Dialog } from '@oxyhq/bloom/dialog'
import { Link, useLocation } from 'react-router-dom'
import { DEFAULT_LOCALE, useLocaleContext, type Locale } from '../../lib/i18n'
import SliceIcon from '../slices/SliceIcon'

interface LanguageDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Locales grouped by region rather than listed alphabetically — past a handful
 * of languages, people look for their part of the world first.
 *
 * Keyed on the leading subtag, so a locale added in the CMS lands in the right
 * group with no code change; anything unmapped falls through to the ungrouped
 * list at the top, next to the default.
 */
const REGION_BY_LANGUAGE: Record<string, string> = {
  ca: 'Europe',
  de: 'Europe',
  es: 'Europe',
  fr: 'Europe',
  it: 'Europe',
  nl: 'Europe',
  pl: 'Europe',
  pt: 'Europe',
  ru: 'Europe',
  uk: 'Europe',
  ar: 'Middle East & Africa',
  he: 'Middle East & Africa',
  sw: 'Middle East & Africa',
  tr: 'Middle East & Africa',
  fil: 'Asia',
  hi: 'Asia',
  id: 'Asia',
  ja: 'Asia',
  ko: 'Asia',
  ms: 'Asia',
  th: 'Asia',
  vi: 'Asia',
  zh: 'Asia',
}

const REGION_ORDER = ['Europe', 'Latin America', 'Middle East & Africa', 'Asia']

function regionOf(code: string): string | null {
  // `es-la`/`pt-br` are the Latin American cuts of European languages, so for
  // those the region comes from the country subtag, not the language.
  const [language, country] = code.toLowerCase().split('-')
  if (country && ['la', 'br', 'mx', 'ar', 'cl', 'co'].includes(country)) return 'Latin America'
  return REGION_BY_LANGUAGE[language] ?? null
}

export default function LanguageDialog({ open, onClose }: LanguageDialogProps) {
  const { locale, locales } = useLocaleContext()
  const { pathname } = useLocation()

  /* Same page, different locale: strip any existing prefix and re-add the new
   * one. The default locale is served unprefixed, so it gets the bare path. */
  const hrefFor = (code: string) => {
    const segments = pathname.split('/').filter(Boolean)
    const head = segments[0]
    const rest = locales.some((entry) => entry.code === head) ? segments.slice(1) : segments
    const path = rest.length > 0 ? `/${rest.join('/')}` : '/'
    return code === DEFAULT_LOCALE ? path : `/${code}${path === '/' ? '' : path}`
  }

  const ungrouped = locales.filter((entry) => regionOf(entry.code) === null)
  const regions = REGION_ORDER.map((region) => ({
    region,
    entries: locales.filter((entry) => regionOf(entry.code) === region),
  })).filter((group) => group.entries.length > 0)

  const Entry = ({ entry }: { entry: { code: Locale; nativeName: string } }) => (
    <Link
      className="flex w-full items-center justify-start whitespace-nowrap rounded-lg py-1 text-start text-b3 outline-none transition duration-300 ease-in-out hover:opacity-60"
      to={hrefFor(entry.code)}
      onClick={onClose}
    >
      {entry.nativeName}
      {entry.code === locale && <SliceIcon name="check" className="ms-1 size-5" />}
    </Link>
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth={420}>
      {/* Bloom's dialog centres its children; this list reads as a directory, so
       * the whole block is pinned back to the start edge. */}
      <div className="w-full p-5 text-start">
        <h2 className="text-start text-subheading-2">Select a language</h2>
        <div className="mt-4">
          <div className="grid grid-cols-2 justify-items-start gap-x-4 gap-y-1">
            {ungrouped.map((entry) => (
              <Entry key={entry.code} entry={entry} />
            ))}
          </div>
        </div>
        {regions.map((group) => (
          <div key={group.region} className="mt-5">
            <h3 className="mb-2 text-start text-b4 uppercase tracking-wider text-alt-gray-e1">{group.region}</h3>
            <div className="grid grid-cols-2 justify-items-start gap-x-4 gap-y-1">
              {group.entries.map((entry) => (
                <Entry key={entry.code} entry={entry} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  )
}
