import mongoose, { Schema, type Document } from 'mongoose'

export interface IJob extends Document {
  title: string
  department: string
  location: string
  type: string
  description: string
  active: boolean
}

const JobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  department: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  type: { type: String, default: 'Full-time' },
  description: { type: String, default: '' },
  active: { type: Boolean, default: true },
}, { timestamps: true })

export const Job = mongoose.model<IJob>('Job', JobSchema)
