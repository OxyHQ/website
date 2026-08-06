import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Markdown written by whoever opened the issue or replied to it.
 *
 * Same path the changelog already uses for GitHub-authored release notes:
 * `react-markdown` with `remark-gfm` and nothing else. That default is what
 * makes it safe to put third-party text in the DOM, and it is worth being
 * precise about why, because it is a property of the configuration rather than
 * of a sanitiser we run:
 *
 *   - Raw HTML in the source is turned into a text node, not elements
 *     (`react-markdown/lib/index.js`, the `node.type === 'raw'` branch), so a
 *     `<script>` in an issue body renders as the literal characters. Adding
 *     `rehype-raw` here would undo exactly that and must not be done.
 *   - `href` and `src` go through `defaultUrlTransform`, which returns an empty
 *     string for any protocol outside the safe list, so `javascript:` and
 *     `data:` URLs never reach the DOM.
 *
 * Help and academy articles are not the precedent to follow: those are MDX
 * compiled at build time from files in this repository, which is trusted input
 * and a different problem.
 */
export default function FeatureMarkdown({ content }: { content: string }) {
  // Two things in the class list below are corrections rather than taste, both
  // measured against the real stylesheet on the real page:
  //
  //   - `strong` and `blockquote` inherit Tailwind Typography's light-mode
  //     defaults, which land at rgb(16,24,40) on this near-black background:
  //     1.09:1, which is to say invisible. Bold text is common in an issue
  //     body, so this is not a corner case.
  //   - The `prose-code:` pill is meant for inline spans. A fenced block is a
  //     `pre` full of `code`, so without the reset every line inside one gets
  //     its own pill background and padding.
  return (
    <div className="prose prose-sm max-w-none font-normal leading-6.5 text-muted-foreground prose-headings:text-foreground prose-a:text-[var(--color-blue-500)] prose-code:text-foreground prose-code:bg-surface prose-code:px-1 prose-code:rounded-md prose-li:marker:text-muted-foreground prose-strong:text-foreground prose-blockquote:text-muted-foreground prose-blockquote:border-border [&_pre_code]:rounded-none [&_pre_code]:bg-transparent [&_pre_code]:p-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Images are remote and third-party. `no-referrer` keeps the page a
          // visitor is reading from leaking to whoever hosts them.
          img: ({ src, alt }) => (
            <img
              src={typeof src === 'string' ? src : undefined}
              alt={alt ?? ''}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="rounded-radius-12 border border-border"
            />
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
