import mongoose, { Schema, Types, type Document } from 'mongoose'

export type ResourceType = 'guide' | 'paper' | 'video' | 'tool' | 'template' | 'link'
export type ResourceStatus = 'draft' | 'published'

export interface IResource extends Document {
  slug: string
  title: string
  summary: string
  type: ResourceType
  coverImage?: Types.ObjectId | null
  category?: Types.ObjectId | null
  href: string
  external: boolean
  tags: string[]
  featured: boolean
  status: ResourceStatus
  publishedAt: Date
  order: number
  createdAt: Date
  updatedAt: Date
}

const ResourceSchema = new Schema<IResource>({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  type: {
    type: String,
    enum: ['guide', 'paper', 'video', 'tool', 'template', 'link'],
    default: 'guide',
    index: true,
  },
  coverImage: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
  category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  href: { type: String, required: true },
  external: { type: Boolean, default: false },
  tags: { type: [String], default: [] },
  featured: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  publishedAt: { type: Date, default: Date.now },
  order: { type: Number, default: 0 },
}, { timestamps: true })

ResourceSchema.index({ status: 1, order: 1, publishedAt: -1 })
ResourceSchema.index({ type: 1, status: 1 })

export const Resource = mongoose.model<IResource>('Resource', ResourceSchema)
