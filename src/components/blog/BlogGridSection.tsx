import { gridArticles } from '../../data/blog'

export default function BlogGridSection() {
  return (
    <div>
      <div
        className="grid gap-px bg-subtle-stroke py-px max-xl:!grid-cols-2 max-lg:!grid-cols-1"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
      >
        {gridArticles.map((article) => (
          <a
            key={article.slug}
            className="group relative grid bg-primary-background py-11 max-xl:grid-cols-12 max-lg:h-fit max-lg:grid-cols-12 grid-cols-8 lg:max-xl:nth-3:hidden"
            href={`/blog/${article.slug}`}
          >
            <div className="pointer-events-none absolute inset-0 bg-secondary-background opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50 group-active:opacity-100 group-active:duration-50" />
            <div className="relative col-[2/-2] flex size-full flex-col justify-between">
              <div>
                <div className="flex justify-between">
                  <p className="text-overline">[{article.category}]</p>
                  <time className="text-overline">{article.date}</time>
                </div>
                <h3 className="relative mt-8 w-fit text-balance font-semibold text-2xl">
                  <span className="attio-group-hover-underline">{article.title}</span>
                </h3>
                <p className="mt-4 line-clamp-2 max-w-[28em] text-pretty text-accent-foreground text-sm max-lg:line-clamp-3">
                  {article.excerpt}
                </p>
              </div>
              <div className="mt-5">
                <p className="truncate whitespace-nowrap text-caption-foreground text-sm">
                  <span className="text-tertiary-foreground">{article.author}</span>{' '}
                  <br className="sm:hidden" />
                  <span>{article.authorRole}</span>
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Bottom decoration with dashed lines */}
      <div aria-hidden="true" className="grid w-full overflow-hidden max-xl:h-30 max-lg:h-25 h-25 grid-cols-24">
        <div className="col-[2/-2] flex justify-between">
          <svg width="1" height="100%" className="text-subtle-stroke invisible">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>
          <svg width="1" height="100%" className="text-subtle-stroke">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>
          <svg width="1" height="100%" className="text-subtle-stroke invisible">
            <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
