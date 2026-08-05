import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { slugify } from './headings'

/**
 * The article body.
 *
 * Element-by-element rather than a `prose` class: the layout puts a contents
 * list beside the text, so headings need the same ids the list links to, and
 * typography plugin output cannot carry them. Everything else is Bloom tokens,
 * so an article reads the same on every host and in both modes.
 */

/** Recovers the heading's text so it can produce the id the contents list uses. */
function headingId(children: ReactNode): string {
  const flatten = (node: ReactNode): string => {
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(flatten).join('')
    if (node && typeof node === 'object' && 'props' in node) {
      const props = (node as { props?: { children?: ReactNode } }).props
      return flatten(props?.children)
    }
    return ''
  }
  return slugify(flatten(children))
}

export default function ArticleMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => (
          <h2
            id={headingId(children)}
            className="mb-5 scroll-mt-24 border-b border-border pb-5 text-heading-responsive-sm text-text"
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 id={headingId(children)} className="mb-4 scroll-mt-24 text-xl font-semibold text-text">
            {children}
          </h3>
        ),
        p: ({ children }) => <p className="mb-10 text-lg leading-[1.8] text-text">{children}</p>,
        ul: ({ children }) => <ul className="mb-10 flex list-disc flex-col gap-2 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-10 flex list-decimal flex-col gap-2 pl-5">{children}</ol>,
        li: ({ children }) => <li className="text-lg leading-[1.8] text-text [&>p]:mb-0">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="font-semibold underline underline-offset-2 hover:text-text-secondary"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
        code: ({ children, className }) =>
          // Only an inline span reaches here without a language class; a fenced
          // block arrives wrapped in <pre> and keeps its own padding.
          className ? (
            <code className={className}>{children}</code>
          ) : (
            <code className="rounded-radius-8 border border-border bg-fill-secondary px-2 py-px text-base text-text-secondary">
              {children}
            </code>
          ),
        pre: ({ children }) => (
          <pre className="mb-10 overflow-x-auto rounded-radius-12 border border-border bg-fill-secondary p-4 text-sm">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-10 flex">
            <div className="-mr-px flex w-10 shrink-0 items-center justify-center border border-border bg-fill-inverse text-bg md:w-16">
              <span aria-hidden className="font-display text-2xl leading-none md:text-4xl">
                “
              </span>
            </div>
            <div className="flex w-full flex-col gap-6 border border-border bg-fill-secondary p-8 font-display text-xl md:p-14 md:text-2xl [&>p]:mb-0 [&>p]:font-display [&>p]:text-inherit [&>p]:leading-snug">
              {children}
            </div>
          </blockquote>
        ),
        img: ({ src, alt }) => (
          <img
            src={typeof src === 'string' ? src : undefined}
            alt={alt ?? ''}
            loading="lazy"
            decoding="async"
            className="mb-10 w-full rounded-radius-12 border border-border"
          />
        ),
        hr: () => <hr className="mb-10 border-border" />,
        table: ({ children }) => (
          <div className="mb-10 overflow-x-auto rounded-radius-12 border border-border">
            <table className="w-full text-left text-base">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-border bg-fill-secondary px-4 py-3 font-semibold text-text">{children}</th>
        ),
        td: ({ children }) => <td className="border-b border-border px-4 py-3 text-text-secondary">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
