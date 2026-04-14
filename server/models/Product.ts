import mongoose, { Schema, type Document } from 'mongoose'

export type ProductCategory = 'live' | 'in-development'

export interface IProduct extends Document {
  productId: string
  name: string
  tagline: string
  description: string
  href: string
  external: boolean
  cta: string
  brand: string
  brandForeground?: string
  mark: string
  category: ProductCategory
  order: number
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tagline: { type: String, default: '' },
  description: { type: String, default: '' },
  href: { type: String, required: true },
  external: { type: Boolean, default: false },
  cta: { type: String, default: 'Learn more' },
  brand: { type: String, required: true },
  brandForeground: { type: String },
  mark: { type: String, required: true },
  category: { type: String, enum: ['live', 'in-development'], default: 'live' },
  order: { type: Number, default: 0 },
}, { timestamps: true })

ProductSchema.index({ category: 1, order: 1 })

export const Product = mongoose.model<IProduct>('Product', ProductSchema)
