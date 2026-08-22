import { Search } from 'lucide-react'
import { GROUP_LABELS, type SearchResult } from '../../lib/site-search'
import { DocsIcon, ModelingIcon } from '../icons'

const SEARCH_APP_ICONS: Record<string, string> = {
  '/mention': '/images/apps/mention.png',
  '/homiio': '/images/landing/homiio-phone.png',
  '/mercaria': '/images/apps/mercaria.svg',
  '/faircoin': '/images/apps/faircoin.svg',
  '/apps/faircoin': '/images/apps/faircoin.svg',
  '/inbox': '/images/apps/inbox.png',
  '/astro': '/images/apps/astro.svg',
  '/os': '/images/apps/oxyos.png',
  '/apps/allo': '/images/apps/allo.png',
}

function searchAppIcon(url: string): string | undefined {
  return SEARCH_APP_ICONS[url.replace(/\/$/, '')]
}

function searchGroupLabel(group: string): string {
  if (group === 'app') return 'Docs · Apps'
  return GROUP_LABELS[group] ?? group
}

function SearchResultLeading({ result, compact = false }: { result: SearchResult; compact?: boolean }) {
  const isApp = Boolean(searchAppIcon(result.url) || result.group === 'apps')
  const kind = result.kind ?? (result.avatar ? 'user' : isApp ? 'app' : result.group === 'pages' ? 'page' : 'doc')
  const sizeClass = compact ? 'size-10' : 'size-8'

  if (kind === 'user') {
    return result.avatar ? (
      <img src={result.avatar} alt="" aria-hidden="true" className={`${sizeClass} shrink-0 rounded-full object-cover`} />
    ) : (
      <span className={`grid ${sizeClass} shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--background)_68%,var(--primary))] text-primary-text text-sm font-medium`}>
        {result.title.trim().charAt(0).toUpperCase()}
      </span>
    )
  }

  if (kind === 'app') {
    const icon = result.icon ?? searchAppIcon(result.url)
    return icon ? (
      <img src={icon} alt="" aria-hidden="true" className={`${sizeClass} shrink-0 rounded-2xl object-cover`} loading="lazy" decoding="async" />
    ) : (
      <span className={`grid ${sizeClass} shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--background)_68%,var(--primary))] text-primary-text text-sm font-medium`}>
        {result.title.trim().charAt(0).toUpperCase()}
      </span>
    )
  }

  const Icon = kind === 'page' ? Search : result.group === 'ui-library' ? ModelingIcon : DocsIcon
  return (
    <span className={`grid ${sizeClass} shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--background)_68%,var(--primary))] text-primary-text`}>
      <Icon className={compact ? 'size-5' : 'size-4'} aria-hidden="true" />
    </span>
  )
}

function SearchResultButton({
  result,
  index,
  activeResult,
  compact,
  onHover,
  onSelect,
}: {
  result: SearchResult
  index: number
  activeResult: number
  compact?: boolean
  onHover: (index: number) => void
  onSelect: (result: SearchResult) => void
}) {
  const isActive = index === activeResult

  return (
    <button
      type="button"
      onMouseEnter={() => onHover(index)}
      onClick={() => onSelect(result)}
      className={compact
        ? `flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[1.625rem] px-1.5 py-2 text-center transition-colors ${isActive ? 'bg-primary/15' : 'hover:bg-primary/10'}`
        : `block w-full cursor-pointer border-t border-primary/20 px-2.5 py-1.5 text-left transition-colors first:border-t-0 ${isActive ? 'bg-primary/10' : 'hover:bg-primary/10'}`}
    >
      <div className={compact ? 'flex flex-col items-center gap-1.5' : 'flex min-w-0 items-center gap-2'}>
        <SearchResultLeading result={result} compact={compact} />
        <div className={compact ? 'min-w-0 max-w-28' : 'min-w-0'}>
          <div className="truncate text-sm text-foreground">{result.title}</div>
          {!compact && <div className="truncate text-body-xs text-muted-foreground">{result.subtitle}</div>}
        </div>
      </div>
    </button>
  )
}

type SearchResultGroup = {
  group: string
  items: SearchResult[]
}

interface NavbarSearchResultsProps {
  groups: readonly SearchResultGroup[]
  flatResults: readonly SearchResult[]
  activeResult: number
  noResultsLabel: string
  onHover: (index: number) => void
  onSelect: (result: SearchResult) => void
}

export default function NavbarSearchResults({
  groups,
  flatResults,
  activeResult,
  noResultsLabel,
  onHover,
  onSelect,
}: NavbarSearchResultsProps) {
  return (
    <div className="absolute inset-x-0 top-[calc(100%-1px)] z-50 max-h-[min(70vh,520px)] overflow-y-auto rounded-b-[2rem] border border-foreground/10 border-t-0 bg-background p-1.5 text-left shadow-sm">
      {flatResults.length === 0 ? (
        <div className="px-space-sm py-space-2xl text-center text-sm text-muted-foreground">{noResultsLabel}</div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.group} className="mb-2 last:mb-0">
              <div className="px-1 pb-1 pt-1.5 text-label-sm font-medium uppercase tracking-wider text-muted-foreground">
                {searchGroupLabel(group.group)}
              </div>
              <div className={group.group === 'apps' ? 'grid grid-flow-col auto-cols-[5.25rem] gap-1 overflow-x-auto rounded-[2rem] bg-[color-mix(in_srgb,var(--background)_84%,var(--primary))] p-1.5' : 'overflow-hidden rounded-[2rem] bg-[color-mix(in_srgb,var(--background)_84%,var(--primary))]'}>
                {group.items.map((result) => {
                  const index = flatResults.indexOf(result)
                  return (
                    <SearchResultButton
                      key={result.id}
                      result={result}
                      index={index}
                      activeResult={activeResult}
                      compact={group.group === 'apps'}
                      onHover={onHover}
                      onSelect={onSelect}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
