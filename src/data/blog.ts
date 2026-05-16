/**
 * NOTE: Blog/news content is sourced from the CMS via `useNewsroomPosts()`.
 * The fake fabricated articles, authors, and funding announcements that
 * lived in this file previously were Attio-clone placeholders — they have
 * been removed. Only static UI scaffolding (category labels) remains.
 *
 * Category counts shown next to filter chips should be computed from the
 * real CMS post list at render-time, not hardcoded here.
 */

export interface BlogArticle {
  slug: string
  title: string
  excerpt: string
  category: string // 'Product' | 'Company' | 'Guides' | 'Inside Oxy' | 'Perspectives'
  date: string
  author: string
  authorRole: string
  readTime?: string
  featured?: boolean
}

export interface BlogCategory {
  label: string
  /** Optional — leave undefined to render no count, or compute from CMS data. */
  count?: number
}

export const blogCategories: BlogCategory[] = [
  { label: 'All articles' },
  { label: 'Company' },
  { label: 'Guides' },
  { label: 'Inside Oxy' },
  { label: 'Perspectives' },
  { label: 'Product' },
]
