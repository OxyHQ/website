import { NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDownIcon } from '../icons/ChevronDownIcon'
import { HTTP_METHODS, loaderFor, type OpenApiSpec } from './docsApiSpec'

interface ApiTagGroup {
  /** Tag display name. */
  name: string
  /**
   * Slugified anchor for the tag header. Format: `tag/{slug}` — matches
   * the IDs Scalar emits on its tag section elements. Per-operation deep
   * links are intentionally omitted from this sidebar because Scalar's
   * operation IDs vary by document name / multi-document mode and would
   * produce dead anchors. Scalar's own in-page sidebar handles per-op
   * navigation; ours just gives a fast tag-level jump table.
   */
  anchor: string
  description?: string
  /** Operation count, displayed as a badge next to the tag name. */
  operationCount: number
}

/**
 * Minimal Scalar-compatible slugifier. Scalar uses
 * `@scalar/helpers/string/slugify` which lowercases the input and replaces
 * any sequence of whitespace, underscores or hyphens with a single `-`,
 * dropping anything that is not a Unicode letter/number. Reimplementing
 * that subset here keeps us off the dep graph and produces identical
 * anchors for the tag names we care about (all plain ASCII).
 */
function slugifyTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Build the OpenAPI-driven sidebar model from a parsed spec. Operations
 * are grouped by `op.tags[0]`; tags declared in the spec's top-level
 * `tags` array preserve their declared order. Empty groups (declared but
 * unreferenced) are dropped from the result.
 */
function buildApiSidebar(spec: OpenApiSpec): ApiTagGroup[] {
  interface MutableGroup {
    name: string
    anchor: string
    description?: string
    count: number
  }
  const groups = new Map<string, MutableGroup>()

  function ensureGroup(name: string, description?: string): MutableGroup {
    const existing = groups.get(name)
    if (existing) {
      if (!existing.description && description) existing.description = description
      return existing
    }
    const created: MutableGroup = {
      name,
      anchor: `api-1/tag/${slugifyTag(name)}`,
      description,
      count: 0,
    }
    groups.set(name, created)
    return created
  }

  // Seed the declared tag order first so Authentication / Users / Profiles
  // surface at the top instead of in operation-discovery order.
  if (spec.tags) {
    for (const tag of spec.tags) {
      if (typeof tag.name === 'string' && tag.name.length > 0) {
        ensureGroup(tag.name, tag.description)
      }
    }
  }

  const paths = spec.paths ?? {}
  for (const item of Object.values(paths)) {
    for (const method of HTTP_METHODS) {
      const op = item[method]
      if (!op) continue
      const tagName = op.tags?.[0] ?? 'Misc'
      const group = ensureGroup(tagName)
      group.count += 1
    }
  }

  const result: ApiTagGroup[] = []
  for (const group of groups.values()) {
    if (group.count === 0) continue
    result.push({
      name: group.name,
      anchor: group.anchor,
      description: group.description,
      operationCount: group.count,
    })
  }
  return result
}

export function DocsApiSidebar({ version }: { version: string }) {
  const location = useLocation()
  // Matches the existing pattern at `ApiBody` — cache the parsed spec per
  // version so flipping between tags doesn't re-parse it.
  const specQuery = useQuery({
    queryKey: ['api-sidebar', version],
    queryFn: async () => {
      const loader = loaderFor(version)
      if (!loader) throw new Error(`No OpenAPI document for version "${version}".`)
      const mod = await loader()
      return buildApiSidebar(mod.default)
    },
    staleTime: Infinity,
  })

  const groups = specQuery.data ?? null

  const activeHash = location.hash.replace(/^#/, '')
  const hubHref = '/developers/docs'

  return (
    <aside className="hidden lg:block w-[19.5rem] shrink-0 border-r border-border">
      <div className="sticky top-[calc(var(--site-header-height,64px)+48px)] h-[calc(100vh-var(--site-header-height,64px)-48px)] overflow-y-auto relative text-sm leading-6 pt-6 pb-10 pl-6 pr-6">
        <NavLink
          to={hubHref}
          className="group flex items-center gap-x-2 mb-4 pr-3 py-1.5 pl-4 cursor-pointer text-left rounded-xl w-full outline-offset-[-1px] hover:bg-surface text-muted-foreground hover:text-foreground"
        >
          <ChevronDownIcon className="rotate-90 text-muted-foreground group-hover:text-foreground" />
          <span>Switch to package docs</span>
        </NavLink>

        {specQuery.isLoading ? (
          <div className="pl-4 text-sm text-muted-foreground">Loading API reference…</div>
        ) : null}
        {specQuery.error instanceof Error ? (
          <div className="pl-4 text-sm text-muted-foreground">
            API reference unavailable: {specQuery.error.message}
          </div>
        ) : null}
        {groups ? (
          <ul className="space-y-px">
            {groups.map((group) => {
              const href = `#${group.anchor}`
              const isActive = activeHash === group.anchor
              const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
                // Scalar IDs contain `/` and React Router intercepts <NavLink>
                // clicks, so the browser's native hash-anchor scroll never
                // fires. Drive scroll manually and update the hash.
                event.preventDefault()
                const target = document.getElementById(group.anchor)
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  if (location.hash !== `#${group.anchor}`) {
                    window.history.replaceState(null, '', `${location.pathname}${location.search}#${group.anchor}`)
                  }
                }
              }
              return (
                <li key={group.name}>
                  <a
                    href={href}
                    onClick={onClick}
                    className={
                      isActive
                        ? 'group flex items-center justify-between pr-3 py-1.5 pl-4 cursor-pointer text-left rounded-xl w-full outline-offset-[-1px] bg-primary/10 text-primary [text-shadow:-0.2px_0_0_currentColor,0.2px_0_0_currentColor]'
                        : 'group flex items-center justify-between pr-3 py-1.5 pl-4 cursor-pointer text-left rounded-xl w-full outline-offset-[-1px] hover:bg-surface text-muted-foreground hover:text-foreground'
                    }
                  >
                    <span className="font-semibold">{group.name}</span>
                    <span className="text-xs text-muted-foreground/70 tabular-nums shrink-0">
                      ({group.operationCount})
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </aside>
  )
}
