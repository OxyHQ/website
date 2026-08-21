import { FileText, Search } from 'lucide-react'
import { GROUP_LABELS, type SearchResult } from '../../lib/site-search'

const SEARCH_APP_ICONS: Record<string, string> = {
  '/mention': '/images/apps/mention.png',
  '/homiio': '/images/landing/homiio-phone.png',
  '/faircoin': '/images/apps/faircoin.svg',
  '/inbox': '/images/apps/inbox.png',
  '/astro': '/images/apps/astro.svg',
  '/os': '/images/apps/oxyos.png',
  '/apps/allo': '/images/apps/allo.png',
}

function searchAppIcon(url: string): string | undefined {
  return SEARCH_APP_ICONS[url.replace(/\/$/, '')]
}

function SearchResultLeading({ result }: { result: SearchResult }) {
  const kind = result.kind ?? (result.avatar ? 'user' : searchAppIcon(result.url) || result.group === 'apps' ? 'app' : result.group === 'pages' ? 'page' : 'doc')

  if (kind === 'user') {
    return result.avatar ? (
      <img src={result.avatar} alt="" aria-hidden="true" className="size-10 shrink-0 rounded-full object-cover" />
    ) : (
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground/10 text-sm font-medium text-foreground">
        {result.title.trim().charAt(0).toUpperCase()}
      </span>
    )
  }

  if (kind === 'app') {
    const icon = result.icon ?? searchAppIcon(result.url)
    return icon ? (
      <img src={icon} alt="" aria-hidden="true" className="size-10 shrink-0 rounded-xl object-cover" loading="lazy" decoding="async" />
    ) : (
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground/10 text-sm font-medium text-foreground">
        {result.title.trim().charAt(0).toUpperCase()}
      </span>
    )
  }

  const Icon = kind === 'page' ? Search : FileText
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-foreground/5 text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
    </span>
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
  onHover: (index: number) => void
  onSelect: (result: SearchResult) => void
}

export default function NavbarSearchResults({
  groups,
  flatResults,
  activeResult,
  onHover,
  onSelect,
}: NavbarSearchResultsProps) {
  return (
    <div className="absolute inset-x-0 top-[calc(100%-1px)] z-50 max-h-[min(70vh,520px)] overflow-y-auto rounded-b-2xl border border-foreground/10 border-t-0 bg-background p-2 text-left shadow-sm">
      {flatResults.length === 0 ? (
        <div className="px-space-sm py-space-2xl text-center text-sm text-muted-foreground">No results</div>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.group} className="mb-4 last:mb-0">
              <div className="px-1 pb-2 pt-3 text-label-sm font-medium uppercase tracking-wider text-muted-foreground">
                {GROUP_LABELS[group.group] ?? group.group}
              </div>
              <div className="overflow-hidden rounded-2xl bg-foreground/[0.03]">
                {group.items.map((result) => {
                  const index = flatResults.indexOf(result)
                  const isActive = index === activeResult
                  return (
                    <button
                      key={result.id}
                      type="button"
                      onMouseEnter={() => onHover(index)}
                      onClick={() => onSelect(result)}
                      className={`block w-full cursor-pointer border-t border-foreground/10 px-space-sm py-space-md text-left transition-colors first:border-t-0 ${isActive ? 'bg-foreground/5' : 'hover:bg-foreground/5'}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <SearchResultLeading result={result} />
                        <div className="min-w-0">
                          <div className="truncate text-sm text-foreground">{result.title}</div>
                          <div className="truncate text-body-xs text-muted-foreground">{result.subtitle}</div>
                        </div>
                      </div>
                    </button>
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
