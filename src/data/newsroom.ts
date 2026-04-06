export interface NewsroomPost {
  _id?: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage?: string
  oxyUserId: string
  authorUsername?: string
  tags: string[]
  category: string
  featured: boolean
  status: 'draft' | 'published'
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export const newsCategories = [
  'Company',
  'Research',
  'Product',
  'Safety',
  'Engineering',
  'Security',
  'All',
] as const

export type NewsCategory = (typeof newsCategories)[number]
