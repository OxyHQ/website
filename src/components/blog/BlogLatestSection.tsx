import { useState, useMemo } from 'react'
import { useNewsroomPosts } from '../../api/hooks'
import { blogCategories } from '../../data/blog'
import { ArrowRightIcon } from '../icons'
import { HorizontalLine, VerticalLine } from '../ui/GridDecoration'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const year = d.getFullYear().toString().slice(-2)
  return `${month} '${year}`
}

export default function BlogLatestSection() {
  const { data, isPending } = useNewsroomPosts({ category: 'Company' })
  const allArticles = data?.posts ?? []
  const [activeCategory, setActiveCategory] = useState('All articles')

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'All articles') return allArticles
    return allArticles.filter((a) => a.categories.includes(activeCategory))
  }, [activeCategory, allArticles])

  // Compute live counts from CMS data so we never display stale fake counts.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 'All articles': allArticles.length }
    for (const cat of blogCategories) {
      if (cat.label === 'All articles') continue
      counts[cat.label] = allArticles.filter((a) => a.categories.includes(cat.label)).length
    }
    return counts
  }, [allArticles])

  return (
    <>
      <HorizontalLine className="w-full text-border" />
      <div className="bg-surface">
        <div className="container">
          <div className="border-border border-x">
            {/* Header */}
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-start !pb-12 lg:grid-cols-24">
              <div className="max-w-[20em] text-pretty text-heading-responsive-sm text-start col-[2/-2] mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">Latest articles</h2>
              </div>
            </header>

            {/* Separator: solid on desktop, dashed on mobile */}
            <HorizontalLine className="w-full text-border max-lg:hidden" />
            <HorizontalLine className="w-full text-border lg:hidden" dashed />

            {/* Content: sidebar + article list */}
            <div className="relative grid grid-cols-24 max-lg:grid-cols-12">
              {/* Category sidebar */}
              <div className="hide-scrollbar relative py-12 max-lg:col-[1/-1] max-lg:overflow-x-scroll max-lg:px-[8.3333333333%] max-lg:py-6 col-[2/9] max-xl:col-[2/7]">
                <ul className="-mx-3.25 flex w-full flex-col gap-0.5 max-lg:flex-row">
                  {blogCategories.map((cat) => {
                    const isActive = activeCategory === cat.label
                    return (
                      <li key={cat.label}>
                        <button
                          onClick={() => setActiveCategory(cat.label)}
                          className={`relative inline-flex cursor-pointer items-center text-nowrap border transition-colors duration-300 ease-in-out hover:duration-50 active:duration-50 disabled:pointer-events-none disabled:cursor-default h-10 rounded-xl px-3.25 has-[>svg:last-child,>img:last-child]:pr-2.5 has-[>svg:first-child,>img:first-child]:pl-2.5 button-ghost justify-start gap-1 text-xl max-lg:text-lg max-xl:w-full ${isActive ? 'pointer-events-none' : ''}`}
                        >
                          <span className={isActive ? 'shrink truncate text-foreground' : 'text-muted-foreground'}>
                            {cat.label}
                          </span>
                          <span className="align-super text-overline">[{categoryCounts[cat.label] ?? 0}]</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {/* Vertical separator line */}
                <VerticalLine className="text-border absolute inset-y-0 right-0 max-lg:hidden" />
              </div>

              {/* Mobile separator */}
              <HorizontalLine className="w-full text-border col-[1/-1] lg:hidden" />

              {/* Article list */}
              <div className="relative isolate max-lg:col-[1/-1] col-[9/-1] max-xl:col-[7/-1]">
                {isPending && (
                  <div className="space-y-6 py-7">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2 px-[6.25%]">
                        <div className="h-5 w-3/4 animate-pulse rounded bg-background" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-background" />
                      </div>
                    ))}
                  </div>
                )}
                {filteredArticles.map((article, index) => (
                  <div key={article._id || article.slug} className="relative z-10 bg-surface" style={{ opacity: 1 }}>
                    <a
                      className="group relative grid grid-cols-16 items-baseline py-7 max-lg:grid-cols-12 transition-[opacity,filter,background-color] duration-500 ease-in-out"
                      href={`/newsroom/${article.slug}`}
                    >
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50 group-active:opacity-100 group-active:duration-50 bg-surface" />
                      <h3 className="relative col-[2/10] text-balance text-lg max-lg:pt-6">{article.title}</h3>
                      <p className="relative col-[11/13] text-overline max-lg:col-[-6/-2] max-lg:row-1 max-lg:justify-self-end">{formatDate(article.publishedAt)}</p>
                      <p className="relative col-[13/15] truncate text-overline max-lg:col-[2/6] max-lg:row-1">[{article.categories[0]}]</p>
                      {/* Arrow icon */}
                      <ArrowRightIcon
                        className="relative top-0.5 col-[-3/-2] justify-self-end text-muted-foreground max-lg:hidden transition-[translate,color] duration-400 ease-in-out group-hover:translate-x-0.5 group-hover:duration-150 group-active:translate-x-0.5 group-active:duration-50"
                      />
                      <p className="relative col-[2/-2] line-clamp-2 max-w-[28em] text-pretty pt-2 text-muted-foreground text-sm max-xl:text-sm">
                        {article.resume}
                      </p>
                    </a>
                    {/* Dashed separator between articles */}
                    <HorizontalLine
                      dashed
                      className={`w-full text-border${index === filteredArticles.length - 1 ? ' hidden' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom decoration */}
            <div aria-hidden="true" className="grid w-full overflow-hidden max-xl:h-30 max-lg:h-25 h-25 grid-cols-24">
              <div className="col-[2/-2] flex justify-between">
                <VerticalLine dashed className="text-border invisible" />
                <VerticalLine dashed className="text-border" />
                <VerticalLine dashed className="text-border invisible" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
