export interface NewsroomPost {
  _id?: string
  slug: string
  title: string
  resume: string
  description?: string
  content: string
  coverImage?: string
  imageAlt?: string
  oxyUserId?: string
  authorUsername?: string
  tags: string[]
  categories: string[]
  featured: boolean
  colorPrimary?: string
  colorSecondary?: string
  dark?: boolean
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
