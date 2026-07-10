import mongoose, { Schema, Types, type Document } from 'mongoose'

export interface INewsroomPost extends Document {
  title: string
  slug: string
  resume: string
  description: string
  content: string
  coverImage: Types.ObjectId
  imageAlt?: string
  oxyUserId?: string
  authorUsername?: string
  tags: string[]
  categories: string[]
  products: Types.ObjectId[]
  featured: boolean
  colorPrimary?: string
  colorSecondary?: string
  dark: boolean
  status: 'draft' | 'published'
  metaTitle?: string
  ogImage: Types.ObjectId | null
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
  coverImage: { type: Schema.Types.ObjectId, ref: 'Media', required: true },
  imageAlt: String,
  oxyUserId: String,
  authorUsername: String,
  tags: [String],
  categories: { type: [String], default: [] },
  products: { type: [{ type: Schema.Types.ObjectId, ref: 'Product' }], default: [] },
  featured: { type: Boolean, default: false },
  colorPrimary: String,
  colorSecondary: String,
  dark: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  metaTitle: String,
  ogImage: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export const NewsroomPost = mongoose.model<INewsroomPost>('NewsroomPost', NewsroomPostSchema)
