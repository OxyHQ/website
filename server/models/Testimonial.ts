import mongoose, { Schema, type Document } from 'mongoose'

export interface ITestimonial extends Document {
  quote: string
  author: string
  role: string
  company: string
  avatar?: string
  order: number
}

const TestimonialSchema = new Schema<ITestimonial>({
  quote: { type: String, required: true },
  author: { type: String, required: true },
  role: { type: String, default: '' },
  company: { type: String, default: '' },
  avatar: String,
  order: { type: Number, default: 0 },
}, { timestamps: true })

export const Testimonial = mongoose.model<ITestimonial>('Testimonial', TestimonialSchema)
