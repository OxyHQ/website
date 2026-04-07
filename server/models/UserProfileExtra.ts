import mongoose, { Schema, type Document } from 'mongoose'

export interface IUserProfileExtra extends Document {
  userId: string
  username: string
  bio: string
  showActivity: boolean
  updatedAt: Date
}

const UserProfileExtraSchema = new Schema<IUserProfileExtra>({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  bio: { type: String, default: '', maxlength: 280 },
  showActivity: { type: Boolean, default: true },
}, { timestamps: { createdAt: false, updatedAt: true } })

export const UserProfileExtra = mongoose.model<IUserProfileExtra>('UserProfileExtra', UserProfileExtraSchema)
