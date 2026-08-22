import type { ComponentPropsWithoutRef } from 'react'
import { mdxContentComponents } from '../../content/_components'
import UnderlineLink from './UnderlineLink'
import { ARTICLE_BLOCK } from './articleBlock'
import { Footnotes, Takeaways } from './ArticleMdxBlocks'
import {
  ArticleCallout,
  ArticleCitation,
  ArticleComparison,
  ArticleFootnotes,
  ArticleMedia,
  ArticleStats,
  ArticleTable,
  ArticleTabs,
  ArticleTestimonialCarousel,
} from './article-blocks/ArticleBlocks'

/**
 * Spacing has exactly one owner per element, as in the source: headings carry
 * `pb-4` plus their own lead-in, and text blocks carry `mt-4` (dropped on the
 * first). The shared docs map is inherited for everything else — callouts,
 * images, code, tables — but its `mt-10`/`my-4` rhythm and `text-2xl` sizes are
 * overridden here, since stacking them on top of this produced ~100px of air
 * above every heading.
 */
export const articleMdxComponents = {
  ...mdxContentComponents,

  Takeaways,
  Footnotes,
  ArticleMedia,
  ArticleCallout,
  ArticleStats,
  ArticleTabs,
  ArticleTestimonialCarousel,
  ArticleComparison,
  ArticleTable,
  ArticleFootnotes,
  ArticleCitation,

  // `first-of-type`, not `first`: the contents nav is the article's first
  // child, so `first` never matches a heading and the opening section would
  // carry a full section lead-in it does not need. The opening heading keeps a
  // short lead-in below `lg`, where the contents collapse to a bar above it.
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <h2
      {...props}
      className={`${ARTICLE_BLOCK} scroll-m-20 pb-4 pt-16 first-of-type:pt-0 max-lg:first-of-type:pt-10 text-primary text-subheading-3`}
    />
  ),
  // A subsection that opens its section sits directly under the section
  // heading, which already carries the space between them.
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <h3 {...props} className={`${ARTICLE_BLOCK} scroll-m-20 pb-4 pt-10 [h2+&]:pt-0 text-foreground text-body-1`} />
  ),
  h4: (props: ComponentPropsWithoutRef<'h4'>) => (
    <h4 {...props} className={`${ARTICLE_BLOCK} scroll-m-20 pb-4 pt-8 text-foreground text-blog-body`} />
  ),

  p: (props: ComponentPropsWithoutRef<'p'>) => (
    <p {...props} className={`${ARTICLE_BLOCK} mt-4 first:mt-0 text-foreground text-blog-body`} />
  ),
  ul: (props: ComponentPropsWithoutRef<'ul'>) => (
    <ul {...props} className={`${ARTICLE_BLOCK} mt-4 grid list-disc ps-5 text-foreground text-blog-body leading-[140%]`} />
  ),
  ol: (props: ComponentPropsWithoutRef<'ol'>) => (
    <ol {...props} className={`${ARTICLE_BLOCK} mt-4 grid list-decimal ps-5 text-foreground text-blog-body leading-[140%]`} />
  ),
  li: (props: ComponentPropsWithoutRef<'li'>) => <li {...props} className="mb-2 last:mb-0" />,
  // The shared map wraps a table in a plain div, which the article grid then
  // auto-places into whatever cell is free — for a table that meant the empty
  // column to the right of the text. It has to carry the block like everything
  // else, and scroll inside it rather than widening the page.
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className={`${ARTICLE_BLOCK} my-6 w-full overflow-x-auto border border-border`}>
      <table {...props} className="w-full text-b4" />
    </div>
  ),
  th: (props: ComponentPropsWithoutRef<'th'>) => (
    <th {...props} className="border-b border-border bg-surface/50 px-4 py-2 text-start font-medium text-foreground" />
  ),
  td: (props: ComponentPropsWithoutRef<'td'>) => (
    <td {...props} className="border-b border-border px-4 py-2 text-muted-foreground last:text-foreground" />
  ),
  hr: (props: ComponentPropsWithoutRef<'hr'>) => <hr {...props} className={`${ARTICLE_BLOCK} my-8 border-border`} />,
  blockquote: (props: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote {...props} className={`${ARTICLE_BLOCK} mt-4 border-s-2 border-tertiary ps-4 text-foreground text-blog-body italic`} />
  ),

  // Prose links wipe their underline in on hover, like every other inline link
  // in this layout.
  a: ({ href = '', children }: ComponentPropsWithoutRef<'a'>) => <UnderlineLink href={href}>{children}</UnderlineLink>,
  sup: (props: ComponentPropsWithoutRef<'sup'>) => <sup {...props} className="ms-0.5 me-1" />,
}
