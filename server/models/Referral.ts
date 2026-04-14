import mongoose, { Schema, type Document } from 'mongoose'

export type ReferralType = 'paid' | 'ambassador' | 'user'
export type ReferralStatus = 'active' | 'paused' | 'revoked'

export interface IReferral extends Document {
  /** Unique short URL-safe code (e.g. "ALEX-2026") — primary lookup key. */
  code: string
  /** Display name of the referrer. Safe to show publicly. */
  name: string
  /** Contact email. Admin-only — never exposed on public endpoints. */
  email?: string
  /** Program bucket — paid affiliates, unpaid ambassadors, or casual users. */
  type: ReferralType
  /** Lifecycle state. Only `active` codes resolve on the public endpoint. */
  status: ReferralStatus
  /** Optional link to an Oxy account by user id. */
  oxyUserId?: string
  /** For type='paid' — commission percent (0–100). */
  commissionPercent?: number
  /** Optional destination override. Defaults to /referrals?ref=CODE when unset. */
  customLandingUrl?: string
  /** Admin-only free-form notes. Never exposed publicly. */
  notes?: string
  /** Visit counter — bumped atomically on POST /:code/click. */
  clicks: number
  /** Signup counter — currently adjusted by hand through the admin. */
  signups: number
  createdAt: Date
  updatedAt: Date
}

const ReferralSchema = new Schema<IReferral>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  type: { type: String, enum: ['paid', 'ambassador', 'user'], required: true, default: 'user' },
  status: { type: String, enum: ['active', 'paused', 'revoked'], required: true, default: 'active' },
  oxyUserId: { type: String },
  commissionPercent: { type: Number, min: 0, max: 100 },
  customLandingUrl: { type: String },
  notes: { type: String },
  clicks: { type: Number, default: 0 },
  signups: { type: Number, default: 0 },
}, { timestamps: true })

ReferralSchema.index({ type: 1 })
ReferralSchema.index({ status: 1 })

export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema)
