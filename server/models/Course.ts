import mongoose, { Schema, Types, type Document } from 'mongoose'

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type CourseStatus = 'draft' | 'published'

export interface ILesson {
  title: string
  slug: string
  content: string
  order: number
  videoUrl?: string
  durationMinutes?: number
}

export interface ICourse extends Document {
  slug: string
  title: string
  summary: string
  description: string
  coverImage?: Types.ObjectId | null
  category?: Types.ObjectId | null
  level: CourseLevel
  durationMinutes?: number
  lessons: ILesson[]
  tags: string[]
  featured: boolean
  status: CourseStatus
  publishedAt: Date
  order: number
  createdAt: Date
  updatedAt: Date
}

const LessonSchema = new Schema<ILesson>({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  content: { type: String, default: '' },
  order: { type: Number, default: 0 },
  videoUrl: { type: String },
  durationMinutes: { type: Number },
}, { _id: false })

const CourseSchema = new Schema<ICourse>({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  coverImage: { type: Schema.Types.ObjectId, ref: 'Media', default: null },
  category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner', index: true },
  durationMinutes: { type: Number },
  lessons: { type: [LessonSchema], default: [] },
  tags: { type: [String], default: [] },
  featured: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
  publishedAt: { type: Date, default: Date.now },
  order: { type: Number, default: 0 },
}, { timestamps: true })

CourseSchema.index({ status: 1, order: 1, publishedAt: -1 })
CourseSchema.index({ featured: 1, order: 1 })

export const Course = mongoose.model<ICourse>('Course', CourseSchema)
