import mongoose, { Schema, type Document } from 'mongoose'

export interface IJob extends Document {
  title: string
  slug: string
  subtitle: string
  department: string
  location: string
  type: string
  compensation: string
  description: Array<
    | { type: 'paragraph'; text: string }
    | { type: 'heading'; text: string }
    | { type: 'list'; items: string[] }
  >
  active: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

function generateSlug(title: string, location: string): string {
  const raw = `${title} ${location}`
  return raw
    .toLowerCase()
    .replace(/[[\]()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const DescriptionBlockSchema = new Schema({
  type: { type: String, enum: ['paragraph', 'heading', 'list'], required: true },
  text: { type: String, default: '' },
  items: { type: [String], default: [] },
}, { _id: false, strict: 'throw' })

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  subtitle: { type: String, default: '' },
  department: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  type: { type: String, default: 'Full-time' },
  compensation: { type: String, default: '' },
  description: { type: [DescriptionBlockSchema], default: [] },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true })

// Auto-generate slug from title + location if not provided
JobSchema.pre('validate', function () {
  if (!this.slug && this.title) {
    this.slug = generateSlug(this.title, this.location || '')
  }
})

export const Job = mongoose.model<IJob>('Job', JobSchema)
