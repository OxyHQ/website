import mongoose, { Schema, type Document } from 'mongoose'

export interface INewsroomPost extends Document {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage?: string
  oxyUserId: string
  tags: string[]
  category: string
  featured: boolean
  status: 'draft' | 'published'
  metaTitle?: string
  metaDescription?: string
  ogImage?: string
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
}

const NewsroomPostSchema = new Schema<INewsroomPost>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  excerpt: { type: String, default: '' },
  content: { type: String, default: '' },
  coverImage: String,
  oxyUserId: { type: String, required: true },
  tags: [String],
  category: { type: String, default: 'general' },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  metaTitle: String,
  metaDescription: String,
  ogImage: String,
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export const NewsroomPost = mongoose.model<INewsroomPost>('NewsroomPost', NewsroomPostSchema)
