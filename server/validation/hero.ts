import { z } from 'zod'

/**
 * Shared zod schemas for the hero singleton.
 *
 * The same shapes back the REST `PUT /api/hero` route, the MCP
 * `update_hero` tool, and any client-side validation. Keeping them in one file
 * means the client and MCP can never drift from the database contract.

 */

/**
 * Either a Media document ObjectId string or a direct CDN/static URL.
 * The model stores both forms — strings are returned as-is to the client,
 * ObjectIds are populated and normalized to URL strings on the frontend.
 */
const mediaRefSchema = z.string()

export const heroUpdateSchema = z.object({
  title: z.string().optional(),
  backgroundVideoWebm: mediaRefSchema.optional(),
  backgroundVideoMp4: mediaRefSchema.optional(),
  backgroundPoster: mediaRefSchema.optional(),
})

/**
 * Raw zod shapes (not wrapped in z.object) for use as MCP tool input schemas.
 * The MCP SDK accepts a record-of-zod-types and builds the JSON schema itself.
 */
export const heroUpdateRawShape = {
  title: z.string().optional(),
  backgroundVideoWebm: mediaRefSchema.optional(),
  backgroundVideoMp4: mediaRefSchema.optional(),
  backgroundPoster: mediaRefSchema.optional(),
}

export type HeroUpdate = z.infer<typeof heroUpdateSchema>
