import { z } from 'zod'

/**
 * Shared zod schemas for the hero singleton.
 *
 * The same shapes back the REST `PUT /api/hero` route, the MCP
 * `update_hero` tool, and any client-side validation. Keeping them in one file
 * means the client and MCP can never drift from the database contract.
 *
 * The carousel slot shape mirrors `src/data/heroCarousel.ts` exactly.
 */

const newsroomCardSchema = z.object({
  type: z.literal('newsroom'),
  title: z.string(),
  image: z.string(),
  category: z.string(),
  slug: z.string(),
})

const careersCardSchema = z.object({
  type: z.literal('careers'),
  jobTitle: z.string(),
  department: z.string(),
  slug: z.string().optional(),
})

const brandCardSchema = z.object({
  type: z.literal('brand'),
  variant: z.enum(['oxy', 'fair']),
})

const photoCardSchema = z.object({
  type: z.literal('photo'),
  image: z.string(),
  alt: z.string(),
})

const faircoinCardSchema = z.object({
  type: z.literal('faircoin'),
})

const valuesCardSchema = z.object({
  type: z.literal('values'),
  heading: z.string(),
  body: z.string(),
})

const videoCardSchema = z.object({
  type: z.literal('video'),
  src: z.string(),
})

export const heroCardSchema = z.discriminatedUnion('type', [
  newsroomCardSchema,
  careersCardSchema,
  brandCardSchema,
  photoCardSchema,
  faircoinCardSchema,
  valuesCardSchema,
  videoCardSchema,
])

export const cardSizeSchema = z.enum(['1x1', '2x1', '1x2', '2x2', '4x2', '5x2'])

export const carouselSlotSchema = z.object({
  size: cardSizeSchema,
  faces: z.array(heroCardSchema).min(1),
  rotateInterval: z.number().int().positive().optional(),
  rounded: z.boolean().optional(),
  roundedLeft: z.boolean().optional(),
})

/**
 * Either a Media document ObjectId string or a direct CDN/static URL.
 * The model stores both forms — strings are returned as-is to the client,
 * ObjectIds are populated and normalized to URL strings on the frontend.
 */
const mediaRefSchema = z.string()

export const heroUpdateSchema = z.object({
  title: z.string().optional(),
  eyebrow: z.string().optional(),
  backgroundVideoWebm: mediaRefSchema.optional(),
  backgroundVideoMp4: mediaRefSchema.optional(),
  backgroundPoster: mediaRefSchema.optional(),
  carouselSlots: z.array(carouselSlotSchema).optional(),
})

/**
 * Raw zod shapes (not wrapped in z.object) for use as MCP tool input schemas.
 * The MCP SDK accepts a record-of-zod-types and builds the JSON schema itself.
 */
export const heroUpdateRawShape = {
  title: z.string().optional(),
  eyebrow: z.string().optional(),
  backgroundVideoWebm: mediaRefSchema.optional(),
  backgroundVideoMp4: mediaRefSchema.optional(),
  backgroundPoster: mediaRefSchema.optional(),
  carouselSlots: z.array(carouselSlotSchema).optional(),
}

export type HeroUpdate = z.infer<typeof heroUpdateSchema>
export type CarouselSlotInput = z.infer<typeof carouselSlotSchema>
export type HeroCardInput = z.infer<typeof heroCardSchema>
