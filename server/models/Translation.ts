import mongoose, { Schema, Document } from 'mongoose'

export interface ITranslation extends Document {
  locale: string
  collection: string
  documentId: string
  fields: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const translationSchema = new Schema<ITranslation>({
  locale: { type: String, required: true },
  collection: { type: String, required: true },
  documentId: { type: String, required: true },
  fields: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true })

translationSchema.index({ locale: 1, collection: 1, documentId: 1 }, { unique: true })

export const Translation = mongoose.model<ITranslation>('Translation', translationSchema)
