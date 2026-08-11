import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getStaticChangelog, type StaticChangelogEntry } from '../../content/changelog-loader'
import { FEATURES } from '../../constants'
import { AnimatedTitle } from '../ui/AnimatedTitle'

const PAGE_SIZE = 10

/**
 * A release body is written for GitHub, so its relative links point inside the
 * repository that published it. Rendered here they resolved against oxy.so and
 * 404'd, so they are re-pointed at the repo on its default branch: `tree` for a
 * directory, `blob` for a file, which is how GitHub itself resolves them.
 */
function resolveReleaseLink(href: string | undefined, entry: StaticChangelogEntry): string | undefined {
  if (!href || /^([a-z]+:|#|\/\/)/i.test(href)) return href
  if (!entry.repoOwner || !entry.repoName) return href
  const path = href.replace(/^\.?\//, '')
  const kind = path.endsWith('/') ? 'tree' : 'blob'
  return `https://github.com/${entry.repoOwner}/${entry.repoName}/${kind}/HEAD/${path}`
}

/**
 * A release body written on GitHub usually opens with its own title, because
 * there the title is not otherwise on the page. Here it sits directly above the
 * body, so the same words landed twice — and matching the two strings does not
 * catch it, since the release title carries a version the heading leaves out.
 *
 * So the rule is structural: a body's leading LEVEL-ONE heading is the release
 * announcing itself and comes off. Every heading below that is a real section
 * of the note and stays.
 */
function withoutLeadingTitle(content: string): string {
  const lines = content.split('\n')
  const first = lines.findIndex((line) => line.trim() !== '')
  if (first === -1 || !/^#\s+/.test(lines[first])) return content
  return lines.slice(first + 1).join('\n').replace(/^\s+/, '')
}

interface ChangelogMonth {
  /** Anchor id, e.g. `june-2026`. */
  id: string
  /** Full label for the aside, e.g. `June`. */
  month: string
  year: number
  /** Short label for the rail, e.g. `Jun 26`. */
  rail: string
  entries: StaticChangelogEntry[]
}

/**
 * The releases, grouped by the month they went out.
 *
 * A changelog is read by when things happened, so the month is the structure
 * and the entries hang off it. Built from the page being shown rather than from
 * every entry: the aside links to anchors, and an anchor on another page is a
 * link that goes nowhere.
 */
function groupByMonth(entries: StaticChangelogEntry[]): ChangelogMonth[] {
  const groups = new Map<string, ChangelogMonth>()
  for (const entry of entries) {
    const date = new Date(entry.date)
    const month = date.toLocaleDateString('en-US', { month: 'long' })
    const year = date.getFullYear()
    const id = `${month.toLowerCase()}-${year}`
    const group = groups.get(id) ?? {
      id,
      month,
      year,
      rail: `${date.toLocaleDateString('en-US', { month: 'short' })} ${String(year).slice(2)}`,
      entries: [],
    }
    group.entries.push(entry)
    groups.set(id, group)
  }
  return [...groups.values()]
}

export default function ChangelogContent() {
  const { entries: allEntries, repos } = getStaticChangelog()

  const [selectedRepo, setSelectedRepo] = useState<string | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)

  // React Compiler memoizes these derived values automatically; manual
  // `useMemo` here trips the immutability rule because the compiler
  // can't prove that `allEntries` won't be mutated downstream.
  const filtered = selectedRepo
    ? allEntries.filter((e) => {
        const [owner, name] = selectedRepo.split('/')
        return e.repoOwner === owner && e.repoName === name
      })
    : allEntries

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const entries = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const months = groupByMonth(entries)
  const years = [...new Set(months.map((m) => m.year))].sort((a, b) => b - a)

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/*
          The dot field and the closing gradient span the page; only the copy is
          held by the container. Inside it, both stopped at the gutter and the
          section read as a panel floating in the middle of the page.
        */}
        <div className="relative">
          <div className="relative isolate">
            <div className="absolute bottom-0 left-0 z-10 w-full h-[200px] bg-[linear-gradient(to_bottom,transparent,var(--color-border))]" aria-hidden="true" />
            {/* Dot pattern background */}
            <svg
              width="100%"
              height="100%"
              className="mask-t-to-50% absolute inset-0 text-muted"
            >
              <defs>
                <pattern id="changelog-hero-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                  <rect x="5.5" y="5.5" width="1" height="1" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#changelog-hero-dots)" />
            </svg>

            <div className="container relative z-20">
              {/*
                Split row, vertical rules only: a horizontal one here would run
                straight into the gradient that closes the section.
              */}
              <div className="flex w-full flex-col border-border lg:flex-row lg:border-x">
                <div className="flex w-full flex-col justify-end gap-10 p-10 pt-30 max-xl:pt-25 max-lg:p-6 max-lg:pt-20 lg:w-[70%] lg:border-r lg:border-border">
                  <p className="font-mono text-xs uppercase text-muted-foreground">Changelog</p>

                  <AnimatedTitle as="h1" className="text-heading-responsive-lg">
                    What&apos;s new?
                  </AnimatedTitle>
                </div>

                <div className="flex flex-col justify-end gap-6 p-10 pb-30 max-lg:p-6 max-lg:pb-16 max-lg:pt-0 lg:w-[30%]">
                  <p className="text-balance text-lg text-foreground lg:text-xl">
                    A rundown of the latest Oxy feature releases, product enhancements, design updates, and important bug fixes.
                  </p>
                {FEATURES.SHOW_NEWSLETTER_FORMS && (
                  <form
                    className="flex flex-col gap-2 mt-6 w-full max-w-xs"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="flex flex-col gap-y-1.5">
                      <div>
                        <input
                          className="block w-full rounded-[10px] bg-background p-[10px_13px] outline-hidden transition-all duration-300 ease-out text-foreground placeholder:text-muted-foreground border border-input hover:border-input hover:shadow-[0px_1px_4px_rgba(56,_62,_71,_0.1)] focus:border-primary focus:ring-[3px] focus:ring-ring/30 placeholder:max-w-full placeholder:text-base placeholder-shown:truncate"
                          placeholder="Your email address"
                          type="text"
                          name="email"
                        />
                      </div>
                    </div>
                    <button
                      className="inline-flex cursor-pointer items-center justify-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default h-11.5 gap-x-2 rounded-full px-3.5 text-base has-[>svg:last-child,>img:last-child]:pr-3 has-[>svg:first-child,>img:first-child]:pl-3 button-primary relative"
                      type="submit"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="animate-spin opacity-0 transition-opacity duration-150">
                          <circle cx="9" cy="9" r="8" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5" />
                          <path d="M17 9C17 10.0506 16.7931 11.0909 16.391 12.0615C15.989 13.0321 15.3997 13.914 14.6569 14.6569C13.914 15.3997 13.0321 15.989 12.0615 16.391C11.0909 16.7931 10.0506 17 9 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="transition-opacity duration-150">Subscribe</span>
                    </button>
                  </form>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="container">
        <div>
          <svg width="100%" height="1" className="w-full text-border">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Repo filter bar */}
      {repos.length > 0 && (
        <div className="container">
          <div>
            <div className="grid grid-cols-12">
              <div className="col-span-full flex flex-wrap gap-2 py-6">
                <button
                  onClick={() => { setSelectedRepo(undefined); setCurrentPage(1) }}
                  className={`inline-flex items-center rounded-[10px] px-3 py-1.5 text-sm transition-colors ${
                    !selectedRepo
                      ? 'bg-primary-foreground text-background'
                      : 'text-muted-foreground hover:text-muted-foreground border border-border'
                  }`}
                >
                  All
                </button>
                {repos.map((r) => {
                  const key = `${r.owner}/${r.name}`
                  return (
                    <button
                      key={key}
                      onClick={() => { setSelectedRepo(key); setCurrentPage(1) }}
                      className={`inline-flex items-center rounded-[10px] px-3 py-1.5 text-sm transition-colors ${
                        selectedRepo === key
                          ? 'bg-primary-foreground text-background'
                          : 'text-muted-foreground hover:text-muted-foreground border border-border'
                      }`}
                    >
                      {r.displayName}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Timeline ─── */}
      {/*
        Two columns from `xl`: the month label rides along on the left while its
        releases scroll past on the right, so you always know where in the year
        you are. Below that width the label sits above its entries instead —
        there is no room for a rail and prose side by side.
      */}
      <div className="container flex gap-10 pb-[60px] lg:pb-[90px]">
        <div className="min-w-0 flex-1">
          {entries.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-lg">No changelog entries yet.</p>
            </div>
          )}

          {months.map((group) => (
            <section
              key={group.id}
              id={group.id}
              className="scroll-mt-[calc(var(--site-header-height)+2rem)] xl:grid xl:grid-cols-[max-content_minmax(0,1fr)]"
            >
              <h3 className="hidden xl:block">
                <span className="sticky top-[calc(var(--site-header-height)+2rem)] block pr-6 pt-1 text-right font-mono text-label-sm font-semibold uppercase tracking-wider text-primary">
                  {group.rail}
                </span>
              </h3>

              <div className="min-w-0">
                {group.entries.map((entry) => (
                  <article key={entry._id} className="flex">
                    {/*
                      The dot marks the release and the line carries the eye to
                      the next one. It is `aria-hidden` because the date beside
                      it already says everything the drawing does.
                    */}
                    <div className="relative flex items-start" aria-hidden="true">
                      <span className="z-10 inline-block size-3 translate-y-2 bg-primary" />
                      <div className="absolute left-1/2 top-3 h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/50 to-foreground/10" />
                    </div>

                    <div className="ml-4 flex-1 pb-14 xl:ml-6">
                      <div className="flex flex-wrap items-center gap-3 pb-6">
                        <h2 className="text-title-sm text-foreground" id={entry._id}>
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </h2>
                        <span className="font-mono text-label-sm uppercase tracking-wider text-muted-foreground">
                          {group.year}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pb-4">
                        {entry.repoDisplayName && (
                          <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-label-sm uppercase tracking-wider text-muted-foreground">
                            {entry.repoDisplayName}
                          </span>
                        )}
                        {entry.tagName && (
                          <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-label-sm text-muted-foreground">
                            {entry.tagName}
                          </span>
                        )}
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-sm px-2 py-0.5 font-mono text-label-sm font-semibold uppercase tracking-wider text-background"
                            style={{ backgroundColor: tagColor(tag) }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h4 className="pb-3 text-heading-lg text-foreground">{entry.title}</h4>

                      <div className="prose prose-sm max-w-none font-normal leading-6.5 text-muted-foreground prose-headings:text-foreground prose-a:text-[var(--color-blue-500)] prose-code:rounded-md prose-code:bg-surface prose-code:px-1 prose-code:text-foreground prose-li:marker:text-muted-foreground">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ href, children }) => (
                              <a href={resolveReleaseLink(href, entry)} target="_blank" rel="noopener noreferrer">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {withoutLeadingTitle(entry.content)}
                        </ReactMarkdown>
                      </div>

                      {entry.htmlUrl && (
                        <a
                          href={entry.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          View on GitHub &rarr;
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Where you are in the year, and a way to jump. */}
        {months.length > 0 && (
          <aside className="hidden w-56 shrink-0 xl:block">
            <nav className="sticky top-[calc(var(--site-header-height)+3rem)] space-y-4">
              <h3 className="font-mono text-label-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Year
              </h3>
              <div className="flex">
                <div className="w-4">
                  <div className="h-[calc(100%-1rem)] w-px translate-y-1 bg-border" />
                </div>
                <ul className="flex flex-col gap-3">
                  {years.map((year) => (
                    <li key={year}>
                      <p className="relative w-fit px-2.5 py-0.5 text-sm font-medium text-foreground">
                        <span className="absolute -left-5 top-1 z-10 inline-block size-2 bg-primary" />
                        {year}
                      </p>
                      <ul className="ml-2.5 space-y-1 pt-1">
                        {months
                          .filter((m) => m.year === year)
                          .map((m) => (
                            <li key={m.id}>
                              <a
                                href={`#${m.id}`}
                                className="block py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                              >
                                {m.month}
                              </a>
                            </li>
                          ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </aside>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="container">
          <div>
            <div className="grid grid-cols-12">
              <div className="col-span-full flex items-center justify-center gap-2 py-10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="rounded-[10px] px-3 py-1.5 text-sm border border-border text-muted-foreground hover:text-muted-foreground disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="rounded-[10px] px-3 py-1.5 text-sm border border-border text-muted-foreground hover:text-muted-foreground disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** Map tag name strings to colors for entries */
function tagColor(tag: string): string {
  const colors: Record<string, string> = {
    Feature: 'rgb(38, 109, 240)',
    Enhancement: 'rgb(125, 96, 255)',
    Design: 'rgb(255, 201, 90)',
    Fix: 'rgb(34, 197, 94)',
    Reports: 'rgb(34, 197, 94)',
    'Bug Fix': 'rgb(34, 197, 94)',
    Breaking: 'rgb(239, 68, 68)',
    Docs: 'rgb(148, 163, 184)',
    Performance: 'rgb(168, 85, 247)',
    Security: 'rgb(239, 68, 68)',
  }
  return colors[tag] || 'rgb(156, 163, 175)'
}
