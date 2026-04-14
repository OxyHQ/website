import mongoose, { Schema, Types, type Document } from 'mongoose'

export type HelpArticleStatus = 'draft' | 'published'

export interface IHelpArticle extends Document {
  slug: string
  title: string
  summary: string
  content: string
  category?: Types.ObjectId | null
  icon?: string
  coverImage?: Types.ObjectId | null
  tags: string[]
  featured: boolean
  status: HelpArticleStatus
  publishedAt: Date
  order: number
  createdAt: Date
  updatedAt: Date
}

const HelpArticleSchema = new Schema<IHelpArticle>({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  content: { type: String, default: '' },
  category: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  icon: { type: String, default: '' },
  coverImage: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
  tags: { type: [String], default: [] },
  featured: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  publishedAt: { type: Date, default: Date.now },
  order: { type: Number, default: 0, index: true },
}, { timestamps: true })

HelpArticleSchema.index({ status: 1, order: 1, publishedAt: -1 })
HelpArticleSchema.index({ category: 1, order: 1 })
HelpArticleSchema.index({ featured: 1, order: 1 })

export const HelpArticle = mongoose.model<IHelpArticle>('HelpArticle', HelpArticleSchema)
