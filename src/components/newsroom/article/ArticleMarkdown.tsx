import { isValidElement, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CENTERED_ARTICLE_BLOCK, WIDE_ARTICLE_BLOCK } from '../../slices/articleBlock'
import {
  ArticleBlockUnavailable,
  ArticleCitation,
  ArticleCustomBlock,
} from '../../slices/article-blocks/ArticleBlocks'
import { expandArticleCitations, parseArticleFence } from '../../slices/article-blocks/schema'
import { slugify } from './headings'

/**
 * The article body.
 *
 * Element-by-element rather than a `prose` class: the layout puts a contents
 * list beside the text, so headings need the same ids the list links to, and
 * typography plugin output cannot carry them. Everything else is Bloom tokens,
 * so an article reads the same on every host and in both modes.
 */

function toText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(toText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props
    return toText(props?.children)
  }
  return ''
}

/** Recovers the heading's text so it can produce the id the contents list uses. */
function headingId(children: ReactNode): string {
  return slugify(toText(children))
}

function parseCustomFence(children: ReactNode) {
  if (!isValidElement<{ className?: string; children?: ReactNode }>(children)) return null
  const name = /(?:^|\s)language-(article-[\w-]+)/.exec(children.props.className ?? '')?.[1]
  return name ? parseArticleFence(name, toText(children.props.children).trim()) : null
}

export default function ArticleMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2
            id={headingId(children)}
            className={`${CENTERED_ARTICLE_BLOCK} scroll-m-20 pb-4 pt-16 first-of-type:pt-0 max-xl:first-of-type:pt-10 text-primary text-subheading-3`}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3
            id={headingId(children)}
            className={`${CENTERED_ARTICLE_BLOCK} scroll-m-20 pb-4 pt-10 [h2+&]:pt-0 text-foreground text-body-1`}
          >
            {children}
          </h3>
        ),
        p: ({ children }) => <p className={`${CENTERED_ARTICLE_BLOCK} mt-4 first:mt-0 text-foreground text-blog-body`}>{children}</p>,
        ul: ({ children }) => <ul className={`${CENTERED_ARTICLE_BLOCK} mt-4 grid list-disc ps-5 text-foreground text-blog-body leading-[140%]`}>{children}</ul>,
        ol: ({ children }) => <ol className={`${CENTERED_ARTICLE_BLOCK} mt-4 grid list-decimal ps-5 text-foreground text-blog-body leading-[140%]`}>{children}</ol>,
        li: ({ children }) => <li className="mb-2 last:mb-0 [&>p]:mt-0">{children}</li>,
        a: ({ href, title, children }) => title === 'citation' && href?.startsWith('#fn-') ? (
          <ArticleCitation id={href.slice('#fn-'.length)}>{children}</ArticleCitation>
        ) : (
          <a
            href={href}
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:decoration-primary"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        code: ({ children, className }) =>
          // Only an inline span reaches here without a language class; a fenced
          // block arrives wrapped in <pre> and keeps its own padding.
          className ? (
            <code className={className}>{children}</code>
          ) : (
            <code className="rounded-radius-8 bg-surface px-2 py-px text-[0.9em] text-muted-foreground">
              {children}
            </code>
          ),
        pre: ({ children }) => {
          const custom = parseCustomFence(children)
          if (custom?.ok) return <ArticleCustomBlock block={custom.block} />
          if (custom && !custom.ok) return <ArticleBlockUnavailable message={custom.message} />
          return (
            <pre className={`${CENTERED_ARTICLE_BLOCK} my-6 overflow-x-auto rounded-radius-12 bg-surface p-4 text-body-sm text-foreground`}>
              {children}
            </pre>
          )
        },
        blockquote: ({ children }) => (
          <blockquote className={`${CENTERED_ARTICLE_BLOCK} mt-6 border-s-2 border-tertiary ps-4 text-foreground text-blog-body italic [&>p]:mt-0`}>
            {children}
          </blockquote>
        ),
        img: ({ src, alt }) => (
          <img
            data-toc-collision-target
            src={typeof src === 'string' ? src : undefined}
            alt={alt ?? ''}
            loading="lazy"
            decoding="async"
            className={`${WIDE_ARTICLE_BLOCK} my-8 w-full rounded-radius-12`}
          />
        ),
        hr: () => <hr className={`${CENTERED_ARTICLE_BLOCK} my-8 border-border`} />,
        table: ({ children }) => (
          <div data-toc-collision-target className={`${WIDE_ARTICLE_BLOCK} my-8 w-full overflow-x-auto border border-border`}>
            <table className="w-full text-start text-body-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-border bg-surface/50 px-4 py-2 text-start font-medium text-foreground">{children}</th>
        ),
        td: ({ children }) => <td className="border-b border-border px-4 py-2 text-muted-foreground last:text-foreground">{children}</td>,
      }}
    >
      {expandArticleCitations(content)}
    </ReactMarkdown>
  )
}
