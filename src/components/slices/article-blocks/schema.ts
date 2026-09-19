import { z } from 'zod'

const MAX_BLOCK_SOURCE_LENGTH = 50_000
const blockWidth = z.enum(['prose', 'wide', 'full']).default('wide')
export function isSafeArticleUrl(value: string): boolean {
  return value.startsWith('/') || /^https?:\/\//i.test(value)
}

export function isSafeExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

const safeUrl = z.string().trim().min(1).max(2_048).refine(
  isSafeArticleUrl,
  'Use a site-relative or HTTP(S) URL.',
)
const externalUrl = z.string().trim().min(1).max(2_048).refine(
  isSafeExternalUrl,
  'Use an HTTP(S) URL.',
)
const richText = z.string().trim().min(1).max(12_000)

const mediaSchema = z.object({
  type: z.enum(['image', 'video', 'embed']),
  src: safeUrl,
  alt: z.string().max(500).default(''),
  title: z.string().max(200).optional(),
  caption: z.string().max(1_000).optional(),
  poster: safeUrl.optional(),
  width: blockWidth,
  aspect: z.enum(['video', 'square', 'auto']).default('video'),
}).superRefine((value, context) => {
  if (value.type === 'embed' && !value.title?.trim()) {
    context.addIssue({ code: 'custom', message: 'Embedded media requires a title.', path: ['title'] })
  }
})

const calloutSchema = z.object({
  eyebrow: z.string().max(120).optional(),
  title: z.string().trim().min(1).max(240),
  body: richText,
  tone: z.enum(['primary', 'tertiary', 'quiet']).default('primary'),
  width: blockWidth.default('prose'),
})

const statsSchema = z.object({
  eyebrow: z.string().max(120).optional(),
  title: z.string().max(240).optional(),
  items: z.array(z.object({
    value: z.string().trim().min(1).max(80),
    label: z.string().trim().min(1).max(160),
    detail: z.string().max(500).optional(),
  })).min(1).max(8),
  width: blockWidth,
})

const tabsSchema = z.object({
  label: z.string().max(160).default('Article tabs'),
  tabs: z.array(z.object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/i).max(80),
    label: z.string().trim().min(1).max(100),
    content: richText,
  })).min(2).max(8),
  width: blockWidth,
})

const testimonialsSchema = z.object({
  label: z.string().max(160).default('Testimonials'),
  items: z.array(z.object({
    quote: z.string().trim().min(1).max(2_500),
    name: z.string().trim().min(1).max(160),
    role: z.string().max(240).optional(),
    image: safeUrl.optional(),
  })).min(1).max(12),
  width: blockWidth,
})

const comparisonSchema = z.object({
  eyebrow: z.string().max(120).optional(),
  title: z.string().max(240).optional(),
  panels: z.tuple([
    z.object({ label: z.string().trim().min(1).max(120), content: richText }),
    z.object({ label: z.string().trim().min(1).max(120), content: richText }),
  ]),
  width: blockWidth,
})

const tableSchema = z.object({
  caption: z.string().max(500).optional(),
  columns: z.array(z.string().trim().min(1).max(160)).min(1).max(12),
  rows: z.array(z.array(z.string().max(2_000)).min(1).max(12)).min(1).max(100),
  width: blockWidth,
}).superRefine((value, context) => {
  value.rows.forEach((row, rowIndex) => {
    if (row.length !== value.columns.length) {
      context.addIssue({
        code: 'custom',
        message: `Row ${rowIndex + 1} must contain ${value.columns.length} cells.`,
        path: ['rows', rowIndex],
      })
    }
  })
})

const footnotesSchema = z.object({
  title: z.string().max(160).default('Notes'),
  items: z.array(z.object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/i).max(80),
    text: z.string().trim().min(1).max(2_000),
    url: externalUrl.optional(),
    linkLabel: z.string().max(160).optional(),
  })).min(1).max(100),
  width: blockWidth.default('prose'),
})

export const ARTICLE_FENCE_SCHEMAS = {
  'article-media': mediaSchema,
  'article-callout': calloutSchema,
  'article-stats': statsSchema,
  'article-tabs': tabsSchema,
  'article-testimonials': testimonialsSchema,
  'article-comparison': comparisonSchema,
  'article-table': tableSchema,
  'article-footnotes': footnotesSchema,
} as const

export type ArticleFenceName = keyof typeof ARTICLE_FENCE_SCHEMAS
export type ArticleMediaProps = z.infer<typeof mediaSchema>
export type ArticleCalloutProps = z.infer<typeof calloutSchema>
export type ArticleStatsProps = z.infer<typeof statsSchema>
export type ArticleTabsProps = z.infer<typeof tabsSchema>
export type ArticleTestimonialsProps = z.infer<typeof testimonialsSchema>
export type ArticleComparisonProps = z.infer<typeof comparisonSchema>
export type ArticleTableProps = z.infer<typeof tableSchema>
export type ArticleFootnotesProps = z.infer<typeof footnotesSchema>

export type ParsedArticleFence = {
  [Name in ArticleFenceName]: { kind: Name; props: z.infer<(typeof ARTICLE_FENCE_SCHEMAS)[Name]> }
}[ArticleFenceName]

export type ArticleFenceParseResult =
  | { ok: true; block: ParsedArticleFence }
  | { ok: false; message: string }

export function isArticleFenceName(value: string): value is ArticleFenceName {
  return value in ARTICLE_FENCE_SCHEMAS
}

/** Parse one typed JSON fence. It never evaluates markup or executable code. */
export function parseArticleFence(name: string, source: string): ArticleFenceParseResult | null {
  if (!isArticleFenceName(name)) return null
  if (source.length > MAX_BLOCK_SOURCE_LENGTH) return { ok: false, message: 'The article block is too large.' }

  let input: unknown
  try {
    input = JSON.parse(source)
  } catch {
    return { ok: false, message: 'The article block contains invalid JSON.' }
  }

  const parsed = ARTICLE_FENCE_SCHEMAS[name].safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'The article block is invalid.' }
  }

  return { ok: true, block: { kind: name, props: parsed.data } as ParsedArticleFence }
}

/** `[[cite:key]]` becomes a safe local anchor; ReactMarkdown renders the sup. */
export function expandArticleCitations(markdown: string): string {
  return markdown.replace(/\[\[cite:([a-z0-9][a-z0-9-]*)\]\]/gi, '[$1](#fn-$1 "citation")')
}
