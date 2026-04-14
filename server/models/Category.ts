import mongoose, { Schema, type Document } from 'mongoose'

/**
 * Reusable grouping labels used across the CMS. A Category is identified
 * by its `slug` and carries a human label plus a `scope` tag that limits
 * where it can be referenced from (apps-section, nav-section, or both).
 *
 * Products reference categories by slug via `product.section`. Navigation
 * dropdowns in "apps" mode read products grouped by these category slugs.
 */

export type CategoryScope = 'apps' | 'nav' | 'generic'

export interface ICategory extends Document {
  slug: string
  label: string
  description?: string
  scope: CategoryScope
  order: number
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>({
  slug: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  scope: { type: String, enum: ['apps', 'nav', 'generic'], default: 'generic' },
  order: { type: Number, default: 0 },
}, { timestamps: true })

CategorySchema.index({ scope: 1, order: 1 })

export const Category = mongoose.model<ICategory>('Category', CategorySchema)
