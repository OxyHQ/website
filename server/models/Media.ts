import mongoose, { Schema, type Document } from 'mongoose'

export interface IMedia extends Document {
  url: string
  thumbnails: {
    sm: string   // 200px wide
    md: string   // 400px wide
    lg: string   // 800px wide
  }
  filename: string
  key: string         // S3 object key (for deletion)
  mimeType: string
  size: number        // bytes
  width?: number
  height?: number
  alt: string
  tags: string[]
  folder: string
  uploadedBy?: string
}

const MediaSchema = new Schema<IMedia>({
  url: { type: String, required: true },
  thumbnails: {
    sm: { type: String, default: '' },
    md: { type: String, default: '' },
    lg: { type: String, default: '' },
  },
  filename: { type: String, required: true },
  key: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, default: 0 },
  width: { type: Number },
  height: { type: Number },
  alt: { type: String, default: '' },
  tags: { type: [String], default: [] },
  folder: { type: String, default: 'images' },
  uploadedBy: { type: String, default: '' },
}, { timestamps: true })

MediaSchema.index({ mimeType: 1 })
MediaSchema.index({ tags: 1 })
MediaSchema.index({ filename: 'text', alt: 'text' })

export const Media = mongoose.model<IMedia>('Media', MediaSchema)
