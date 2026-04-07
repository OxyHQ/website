import mongoose, { Schema, type Document } from 'mongoose'

export interface INewsroomPost extends Document {
  title: string
  slug: string
  resume: string
  description: string
  content: string
  coverImage?: string
  imageAlt?: string
  oxyUserId: string
  authorUsername: string
  tags: string[]
  categories: string[]
  featured: boolean
  colorPrimary?: string
  colorSecondary?: string
  dark: boolean
  status: 'draft' | 'published'
  metaTitle?: string
  ogImage?: string
  publishedAt: Date
  createdAt: Date
  updatedAt: Date
}

const NewsroomPostSchema = new Schema<INewsroomPost>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  resume: { type: String, default: '' },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  coverImage: String,
  imageAlt: String,
  oxyUserId: { type: String, required: true },
  authorUsername: { type: String, default: '' },
  tags: [String],
  categories: { type: [String], default: [] },
  featured: { type: Boolean, default: false },
  colorPrimary: String,
  colorSecondary: String,
  dark: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  metaTitle: String,
  ogImage: String,
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export const NewsroomPost = mongoose.model<INewsroomPost>('NewsroomPost', NewsroomPostSchema)
