import {
  type KeyboardEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react'
import {
  ARTICLE_FRAME_BLOCK,
  CENTERED_ARTICLE_BLOCK,
  WIDE_ARTICLE_BLOCK,
} from '../articleBlock'
import type {
  ArticleCalloutProps,
  ArticleComparisonProps,
  ArticleFootnotesProps,
  ArticleMediaProps,
  ArticleStatsProps,
  ArticleTableProps,
  ArticleTabsProps,
  ArticleTestimonialsProps,
  ParsedArticleFence,
} from './schema'
import { isSafeArticleUrl } from './schema'

type ArticleWidth = 'prose' | 'wide' | 'full'
type OptionalWidth<T extends { width: ArticleWidth }> = Omit<T, 'width'> & { width?: ArticleWidth }

function placement(width: ArticleWidth = 'wide'): string {
  if (width === 'prose') return CENTERED_ARTICLE_BLOCK
  if (width === 'full') return ARTICLE_FRAME_BLOCK
  return WIDE_ARTICLE_BLOCK
}

function collisionProps(width: ArticleWidth = 'wide') {
  return width === 'prose' ? {} : { 'data-toc-collision-target': true }
}

/** Small, safe Markdown subset for text nested inside a typed article block. */
function RichText({ children }: { children: ReactNode }) {
  if (typeof children !== 'string') return <>{children}</>
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children: value }) => <p className="mt-3 first:mt-0 text-blog-body">{value}</p>,
        ul: ({ children: value }) => <ul className="mt-3 list-disc ps-5 text-blog-body">{value}</ul>,
        ol: ({ children: value }) => <ol className="mt-3 list-decimal ps-5 text-blog-body">{value}</ol>,
        li: ({ children: value }) => <li className="mt-1">{value}</li>,
        a: ({ href, children: value }) => (
          <a
            href={href}
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="font-medium text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary"
          >
            {value}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

export function ArticleMedia({
  type,
  src,
  alt = '',
  title,
  caption,
  poster,
  width = 'wide',
  aspect = 'video',
}: OptionalWidth<ArticleMediaProps>) {
  if (!isSafeArticleUrl(src) || (poster && !isSafeArticleUrl(poster))) {
    return <ArticleBlockUnavailable message="This media URL is not allowed." />
  }

  const aspectClass = aspect === 'square' ? 'aspect-square' : aspect === 'auto' ? 'h-auto' : 'aspect-video'
  return (
    <figure
      data-toc-skip
      data-article-block-width={width}
      {...collisionProps(width)}
      className={`${placement(width)} my-8 w-full`}
    >
      {type === 'image' && (
        <img src={src} alt={alt} loading="lazy" decoding="async" className={`${aspectClass} w-full rounded-radius-12 object-cover`} />
      )}
      {type === 'video' && (
        <video
          src={src}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          aria-label={title || alt || 'Article video'}
          className={`${aspectClass} w-full rounded-radius-12 bg-surface object-cover`}
        />
      )}
      {type === 'embed' && (
        <iframe
          src={src}
          title={title || 'Embedded article media'}
          loading="lazy"
          sandbox="allow-scripts allow-presentation"
          allow="fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          className={`${aspectClass} w-full rounded-radius-12 bg-surface`}
        />
      )}
      {caption && <figcaption className="mt-3 text-body-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  )
}

export function ArticleCallout({
  eyebrow,
  title,
  body,
  tone = 'primary',
  width = 'prose',
}: OptionalWidth<ArticleCalloutProps>) {
  const surface = tone === 'tertiary'
    ? 'bg-[color-mix(in_srgb,var(--tertiary)_16%,var(--background))]'
    : tone === 'quiet'
      ? 'bg-surface'
      : 'bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))]'

  return (
    <aside
      data-toc-skip
      data-article-block-width={width}
      {...collisionProps(width)}
      className={`${placement(width)} ${surface} my-8 w-full rounded-radius-12 p-6 text-foreground sm:p-8`}
    >
      {eyebrow && <p className="text-body-sm text-tertiary">{eyebrow}</p>}
      <h3 className={`${eyebrow ? 'mt-2' : ''} text-primary text-subheading-2`}>{title}</h3>
      <div className="mt-3"><RichText>{body}</RichText></div>
    </aside>
  )
}

export function ArticleStats({ eyebrow, title, items, width = 'wide' }: OptionalWidth<ArticleStatsProps>) {
  return (
    <section
      data-toc-skip
      data-article-block-width={width}
      {...collisionProps(width)}
      className={`${placement(width)} my-10 w-full rounded-radius-12 bg-primary p-6 text-primary-foreground sm:p-8`}
    >
      {eyebrow && <p className="text-body-sm text-primary-foreground/70">{eyebrow}</p>}
      {title && <h3 className="mt-2 max-w-[32em] text-primary-foreground text-subheading-2">{title}</h3>}
      <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={`${item.value}-${item.label}`} className="border-t border-primary-foreground/25 pt-4">
            <dt className="text-primary-foreground text-subheading-1">{item.value}</dt>
            <dd className="mt-2 text-body-3 text-primary-foreground">{item.label}</dd>
            {item.detail && <dd className="mt-1 text-body-sm text-primary-foreground/70">{item.detail}</dd>}
          </div>
        ))}
      </dl>
    </section>
  )
}

export function ArticleTabs({ label = 'Article tabs', tabs, width = 'wide' }: OptionalWidth<ArticleTabsProps>) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '')
  const baseId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeId))
  const activeTab = tabs[activeIndex]

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, nextIndex: number) => {
    event.preventDefault()
    const index = (nextIndex + tabs.length) % tabs.length
    setActiveId(tabs[index].id)
    tabRefs.current[index]?.focus()
  }

  return (
    <section
      data-toc-skip
      data-article-block-width={width}
      {...collisionProps(width)}
      className={`${placement(width)} my-10 w-full overflow-hidden rounded-radius-12 bg-surface`}
    >
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto p-2 [scrollbar-width:none]">
        {tabs.map((tab, index) => {
          const selected = tab.id === activeTab?.id
          return (
            <button
              key={tab.id}
              ref={(node) => { tabRefs.current[index] = node }}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') moveFocus(event, index + 1)
                if (event.key === 'ArrowLeft') moveFocus(event, index - 1)
                if (event.key === 'Home') moveFocus(event, 0)
                if (event.key === 'End') moveFocus(event, tabs.length - 1)
              }}
              className={`shrink-0 rounded-full px-4 py-2 text-body-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'}`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {activeTab && (
        <div
          id={`${baseId}-panel-${activeTab.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeTab.id}`}
          tabIndex={0}
          className="p-6 pt-4 text-foreground sm:p-8 sm:pt-6"
        >
          <RichText>{activeTab.content}</RichText>
        </div>
      )}
    </section>
  )
}

export function ArticleTestimonialCarousel({
  label = 'Testimonials',
  items,
  width = 'wide',
}: OptionalWidth<ArticleTestimonialsProps>) {
  const [index, setIndex] = useState(0)
  const item = items[index]
  if (!item) return null

  const move = (direction: number) => setIndex((current) => (current + direction + items.length) % items.length)
  return (
    <section
      data-toc-skip
      data-article-block-width={width}
      {...collisionProps(width)}
      aria-label={label}
      aria-roledescription="carousel"
      className={`${placement(width)} my-10 w-full rounded-radius-12 bg-[color-mix(in_srgb,var(--tertiary)_14%,var(--background))] p-6 sm:p-8`}
    >
      <div aria-live="polite" aria-atomic="true">
        <blockquote className="max-w-[36em] text-primary text-subheading-2">“{item.quote}”</blockquote>
        <div className="mt-6 flex items-center gap-3">
          {item.image && isSafeArticleUrl(item.image) && (
            <img src={item.image} alt="" loading="lazy" className="size-11 rounded-full object-cover" />
          )}
          <p className="text-body-sm text-foreground">
            <strong className="block font-medium">{item.name}</strong>
            {item.role && <span className="text-muted-foreground">{item.role}</span>}
          </p>
        </div>
      </div>
      {items.length > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-tertiary/25 pt-4">
          <p className="text-body-sm tabular-nums text-muted-foreground">{index + 1} / {items.length}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => move(-1)} aria-label="Previous testimonial" className="rounded-full border border-primary/35 p-2 text-primary outline-none hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <ArrowLeft size={18} weight="bold" />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next testimonial" className="rounded-full border border-primary/35 p-2 text-primary outline-none hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export function ArticleComparison({
  eyebrow,
  title,
  panels,
  width = 'wide',
}: OptionalWidth<ArticleComparisonProps>) {
  return (
    <section
      data-toc-skip
      data-article-block-width={width}
      {...collisionProps(width)}
      className={`${placement(width)} my-10 w-full`}
    >
      {eyebrow && <p className="text-body-sm text-tertiary">{eyebrow}</p>}
      {title && <h3 className="mt-2 text-primary text-subheading-2">{title}</h3>}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {panels.map((panel, index) => (
          <article
            key={panel.label}
            className={`rounded-radius-12 p-6 ${index === 0 ? 'bg-surface' : 'bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))]'}`}
          >
            <h4 className="text-body-2 text-primary">{panel.label}</h4>
            <div className="mt-4 text-foreground"><RichText>{panel.content}</RichText></div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ArticleTable({ caption, columns, rows, width = 'wide' }: OptionalWidth<ArticleTableProps>) {
  return (
    <div
      data-toc-skip
      data-article-block-width={width}
      {...collisionProps(width)}
      className={`${placement(width)} my-10 w-full overflow-x-auto [scrollbar-width:thin]`}
    >
      <table className="min-w-full text-start text-body-sm text-foreground">
        {caption && <caption className="pb-4 text-start text-body-3 text-primary">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => <th key={column} scope="col" className="border-b border-primary/35 px-4 py-3 text-start font-medium">{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join('-')}`} className="odd:bg-surface/45">
              {row.map((cell, cellIndex) => (
                <td key={`${cellIndex}-${cell}`} className="border-b border-border px-4 py-3 align-top text-muted-foreground first:text-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ArticleCitation({ id, children }: { id: string; children?: ReactNode }) {
  return (
    <sup id={`fnref-${id}`} className="ms-0.5 me-1">
      <a href={`#fn-${id}`} aria-label={`See note ${id}`} className="text-primary underline underline-offset-2">{children ?? id}</a>
    </sup>
  )
}

export function ArticleFootnotes({ title = 'Notes', items, width = 'prose' }: OptionalWidth<ArticleFootnotesProps>) {
  return (
    <section data-toc-skip data-article-block-width={width} {...collisionProps(width)} className={`${placement(width)} mt-14 w-full border-t border-border pt-6`}>
      <h3 className="text-primary text-body-3">{title}</h3>
      <ol className="mt-4 grid gap-3 ps-5 text-body-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item.id} id={`fn-${item.id}`}>
            <span>{item.text}</span>{' '}
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                {item.linkLabel || 'Source'} <ArrowUpRight aria-hidden className="inline size-3" />
              </a>
            )}{' '}
            <a href={`#fnref-${item.id}`} aria-label={`Back to citation ${item.id}`} className="text-primary no-underline">↩</a>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function ArticleBlockUnavailable({ message = 'This article block is unavailable.' }: { message?: string }) {
  return (
    <aside data-toc-skip data-article-block-width="prose" className={`${CENTERED_ARTICLE_BLOCK} my-6 w-full rounded-radius-12 bg-surface p-4 text-body-sm text-muted-foreground`}>
      {message}
    </aside>
  )
}

export function ArticleCustomBlock({ block }: { block: ParsedArticleFence }) {
  switch (block.kind) {
    case 'article-media': return <ArticleMedia {...block.props} />
    case 'article-callout': return <ArticleCallout {...block.props} />
    case 'article-stats': return <ArticleStats {...block.props} />
    case 'article-tabs': return <ArticleTabs {...block.props} />
    case 'article-testimonials': return <ArticleTestimonialCarousel {...block.props} />
    case 'article-comparison': return <ArticleComparison {...block.props} />
    case 'article-table': return <ArticleTable {...block.props} />
    case 'article-footnotes': return <ArticleFootnotes {...block.props} />
    default: return <ArticleBlockUnavailable />
  }
}
