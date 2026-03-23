import mongoose, { Schema, type Document } from 'mongoose'

export interface IPricingPlan extends Document {
  name: string
  price: { monthly: number; annual: number }
  description: string
  features: string[]
  cta: string
  highlighted: boolean
  order: number
}

const PricingPlanSchema = new Schema<IPricingPlan>({
  name: { type: String, required: true },
  price: {
    monthly: { type: Number, required: true },
    annual: { type: Number, required: true },
  },
  description: { type: String, default: '' },
  features: [String],
  cta: { type: String, default: 'Get started' },
  highlighted: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true })

export const PricingPlan = mongoose.model<IPricingPlan>('PricingPlan', PricingPlanSchema)
