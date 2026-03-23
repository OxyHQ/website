import mongoose, { Schema, Document } from 'mongoose'

export interface ILocale extends Document {
  code: string
  slug: string
  name: string
  nativeName: string
  isDefault: boolean
  enabled: boolean
  order: number
}

const localeSchema = new Schema<ILocale>({
  code: { type: String, required: true, unique: true },
  slug: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  nativeName: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true })

// Auto-generate slug from code if not provided (e.g. "en-US" -> "en-us")
localeSchema.pre('validate', function () {
  if (!this.slug && this.code) {
    this.slug = this.code.toLowerCase()
  }
})

export const Locale = mongoose.model<ILocale>('Locale', localeSchema)
