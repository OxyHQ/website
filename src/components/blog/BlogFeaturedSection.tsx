import { useNewsroomPosts } from '../../api/hooks'
import { readTime } from '../../lib/userUtils'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const year = d.getFullYear().toString().slice(-2)
  return `${month} '${year}`
}

export default function BlogFeaturedSection() {
  const { data } = useNewsroomPosts({ category: 'Company', featured: true, limit: 1 })
  const article = data?.posts?.[0] ?? null

  if (!article) return null

  return (
    <div>
      {/* Top spacer */}
      <div aria-hidden="true" className="grid h-40 w-full grid-cols-12 overflow-hidden max-xl:h-30 max-lg:h-25 !h-28 max-md:!h-15 max-lg:!h-20">
        <div className="col-[2/-2] flex justify-between">
        </div>
      </div>

      {/* Dashed separator */}
      <svg width="100%" height="1" className="text-border max-lg:hidden">
        <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
      </svg>

      {/* Featured article link */}
      <a className="group relative block" href={`/newsroom/${article.slug}`}>
        {/* Hover overlay */}
        <div className="pointer-events-none absolute inset-0 bg-surface opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-80 group-hover:duration-50 group-active:opacity-100 group-active:duration-50" />

        {/* Mobile layout */}
        <div className="contents lg:hidden">
          <svg width="100%" height="1" className="text-border relative">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
          </svg>
          <img
            alt=""
            width="1161"
            height="652"
            className="relative aspect-video w-full"
            src={article.coverImage || '/images/blog-cover-ask-oxy.png'}
            loading="lazy"
            decoding="async"
          />
          <svg width="100%" height="1" className="text-border relative">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </div>

        {/* Mobile text content */}
        <div className="relative grid grid-cols-12 py-11 lg:hidden">
          <div className="col-[2/-2]">
            <div className="flex justify-between gap-8">
              <p className="text-overline">[{article.categories[0]}]</p>
              <p className="text-overline">{formatDate(article.publishedAt)}</p>
            </div>
            <h2 className="relative text-balance text-heading-responsive-lg mt-8">
              <span className="attio-group-hover-underline">{article.title}</span>
            </h2>
            <p className="mt-5 line-clamp-3 max-w-[28em] text-pretty text-muted-foreground text-sm">
              {article.resume}
            </p>
            <div className="mt-5 text-sm">
              <p className="whitespace-nowrap text-muted-foreground max-sm:mt-0.5 lg:max-xl:mt-0.5">
                <span className="text-muted-foreground">{article.authorUsername}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Desktop layout */}
        <div className="group contents max-lg:hidden">
          <div className="relative grid grid-cols-24 gap-y-8 pt-8 pb-12">
            <p className="text-overline col-[1/3] justify-self-center max-xl:hidden">{formatDate(article.publishedAt)}</p>
            <p className="text-overline col-[3/10]">[{article.categories[0]}]</p>
            <p className="text-overline col-[21/23] justify-self-end max-xl:hidden">{readTime(article.content)}</p>
            <p className="text-overline col-[21/23] justify-self-end xl:hidden">{formatDate(article.publishedAt)}</p>
            <div className="col-[3/-3] flex items-end justify-between gap-8">
              <h2 className="relative text-balance text-heading-responsive-lg [text-box-edge:text_alphabetic] [text-box-trim:trim-end]">
                <span className="attio-group-hover-underline">{article.title}</span>
              </h2>
              <div className="text-end max-xl:text-sm [text-box-edge:text_alphabetic] [text-box-trim:trim-end]">
                <p className="whitespace-nowrap text-muted-foreground max-sm:mt-0.5 lg:max-xl:mt-0.5">
                  <span className="text-muted-foreground">{article.authorUsername}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Solid separator */}
          <svg width="100%" height="1" className="text-border relative">
            <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
          </svg>
        </div>

        {/* Desktop image with dashed vertical lines */}
        <div className="contents max-lg:hidden">
          <div className="relative grid grid-cols-12">
            <div aria-hidden="true" className="grid h-40 w-full overflow-hidden max-xl:h-30 max-lg:h-25 !h-auto absolute -top-5 bottom-0 grid-cols-24">
              <div className="col-[2/-2] flex justify-between">
                <svg width="1" height="100%" className="text-border">
                  <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
                </svg>
                <svg width="1" height="100%" className="text-border">
                  <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="col-[2/-2]">
              <img
                alt=""
                width="1161"
                height="652"
                className="aspect-video w-full"
                src={article.coverImage || '/images/blog-cover-ask-oxy.png'}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </a>

      {/* Bottom spacing with dashed vertical lines (desktop only) */}
      <div className="contents max-lg:hidden">
        <svg width="100%" height="1" className="text-border relative">
          <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeLinecap="round" />
        </svg>
        <div aria-hidden="true" className="grid h-40 w-full overflow-hidden max-xl:h-30 max-lg:h-25 !h-25 relative grid-cols-24">
          <div className="col-[2/-2] flex justify-between">
            <svg width="1" height="100%" className="text-border">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
            <svg width="1" height="100%" className="text-border">
              <line x1="0.5" y1="0" x2="0.5" y2="100%" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
