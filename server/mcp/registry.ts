import type { z } from 'zod'
import type { ToolResult } from './results.js'

/* ──────────────────────────────────────────────
 * How a tool is declared.
 *
 * A tool is declared once, in the file for its domain under `tools/`, and
 * compiled into both the Oxy capability catalog and the MCP handler table
 * (`catalog.ts`). Access policy and declared effects live in `mcpAccess.ts`;
 * the boot fails if a tool lacks either.
 * ──────────────────────────────────────────── */

export type ToolShape = Record<string, z.ZodType>

/**
 * Who is acting and on which request. `actorId` is the connection's active Oxy
 * account as Oxy reported it on introspection — never a value from the tool
 * input — so it is what audit fields record. Editorial fields such as a post's
 * author stay separate and may name someone else.
 */
export interface ToolContext {
  actorId: string
  scopes?: readonly string[]
  signal?: AbortSignal
  requestId?: string | number
}

/**
 * The shape of a successful result, which fixes its `outputSchema`:
 * - `object` — a JSON object, sent as `structuredContent` as is;
 * - `items` — a JSON array (kept as the text content, for existing clients),
 *   sent as `structuredContent: { items }`, since structured content must be an
 *   object.
 */
export type ToolOutput = 'object' | 'items'

export interface ToolOptions {
  output?: ToolOutput
  /** Validates the success payload (`structuredContent`) for admins and readers alike. */
  outputSchema?: z.ZodObject
  /**
   * The tool takes a `locale` to read in. It is checked against the enabled
   * locales before either path runs, so an admin and a reader get the same
   * refusal for a locale the site does not serve.
   */
  localized?: boolean
}

export interface ToolDefinition {
  name: string
  description: string
  shape: ToolShape
  options: ToolOptions
  handler: (args: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>
}

export interface ToolRegistrar {
  tool<Shape extends ToolShape>(
    name: string,
    description: string,
    shape: Shape,
    handler: (args: z.infer<z.ZodObject<Shape>>, context: ToolContext) => Promise<ToolResult>,
    options?: ToolOptions,
  ): void
}
