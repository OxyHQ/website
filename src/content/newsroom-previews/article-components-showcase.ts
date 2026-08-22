/// <reference types="vite/client" />

import type { NewsroomPost } from '../../data/newsroom'

const markdownModules = import.meta.glob<string>('./article-components-showcase.md.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
})
const content = markdownModules['./article-components-showcase.md.txt']
if (!content) throw new Error('Newsroom article-components showcase Markdown is missing')

/**
 * Development-only Newsroom fixture. The detail hook imports this module only
 * behind `import.meta.env.DEV`, so neither its metadata nor its Markdown enters
 * the production bundle, sitemap, API, or database.
 */
export const articleComponentsShowcasePost: NewsroomPost = {
  slug: 'article-components-showcase-preview',
  title: 'A richer editorial language for Oxy Newsroom',
  resume: 'A working tour of reusable media, callouts, metrics, tabs, institutional quotations, comparisons, tables, citations, and notes.',
  description: 'A local-only Oxy Newsroom article used to validate every reusable rich-content block before publication.',
  content,
  coverImage: '/images/nav-bloom-ui.webp',
  imageAlt: 'A grid of portrait photographs paired with colorful palette swatches',
  authorUsername: 'Oxy Editorial',
  tags: ['editorial-system', 'newsroom', 'bloom'],
  categories: ['Engineering', 'Product'],
  products: [],
  featured: false,
  themePreset: 'oxy',
  status: 'draft',
  metaTitle: 'A richer editorial language for Oxy Newsroom',
  metaDescription: 'A local-only article demonstrating every reusable Newsroom content block.',
  ogImage: '/images/nav-bloom-ui.webp',
  publishedAt: '2026-08-22T09:00:00.000Z',
  createdAt: '2026-08-22T09:00:00.000Z',
  updatedAt: '2026-08-22T09:00:00.000Z',
}
