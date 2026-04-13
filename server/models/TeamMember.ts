import mongoose, { Schema, type Document } from 'mongoose'

export interface ITeamMember extends Document {
  name: string
  slug: string
  role: string
  department: string
  bio: string
  avatar: string
  order: number
  active: boolean
  socials: {
    linkedin?: string
    twitter?: string
    github?: string
    website?: string
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const TeamMemberSchema = new Schema<ITeamMember>({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  role: { type: String, required: true },
  department: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  socials: {
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    github: { type: String, default: '' },
    website: { type: String, default: '' },
  },
}, { timestamps: true })

TeamMemberSchema.pre('validate', function () {
  if (!this.slug && this.name) {
    this.slug = generateSlug(this.name)
  }
})

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema)
