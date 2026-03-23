import mongoose, { Schema, Document } from 'mongoose'

export interface ILocale extends Document {
  code: string
  name: string
  nativeName: string
  isDefault: boolean
  enabled: boolean
  order: number
}

const localeSchema = new Schema<ILocale>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nativeName: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true })

export const Locale = mongoose.model<ILocale>('Locale', localeSchema)
