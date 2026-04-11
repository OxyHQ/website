import mongoose, { Schema, Document } from 'mongoose'

export interface ITranslation {
  locale: string
  collectionName: string
  documentId: string
  fields: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const translationSchema = new Schema<ITranslation>({
  locale: { type: String, required: true },
  collectionName: { type: String, required: true },
  documentId: { type: String, required: true },
  fields: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true })

translationSchema.index({ locale: 1, collectionName: 1, documentId: 1 }, { unique: true })

export const Translation = mongoose.model<ITranslation>('Translation', translationSchema)
