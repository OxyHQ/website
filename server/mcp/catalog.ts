import { z } from 'zod'
import { appCapabilityCatalogSchema, type AppCapabilityCatalog, type CatalogTool } from '@oxy.so/contracts'
import type { CatalogMcpAuthorizationDecision, CatalogInvocationContext, CatalogToolHandlers, CatalogToolResult } from '@oxy.so/mcp'
import { config } from '../config.js'
import { effectsFor, MCP_TOOL_ACCESS, PublicReadRefused, type McpToolAccess } from '../mcpAccess.js'
import { MAX_BULK_ITEMS } from './tools/media.js'
import { TOOL_DOMAINS } from './tools/index.js'
import { idempotencyKeyInput, withIdempotency } from './idempotency.js'
import { resolveReadLocale } from './localized.js'
import { costOf, spend, TOOL_COST } from './rateLimit.js'
import type { ToolContext, ToolDefinition, ToolRegistrar } from './registry.js'
import { errorOf, MCP_ERROR_CODES, ok, toolError, type ToolResult } from './results.js'
import { MAX_PAGE_SIZE } from './schemas.js'

/* ──────────────────────────────────────────────
 * From declared tools to the Oxy capability catalog and the MCP handler table.
 * ──────────────────────────────────────────── */

/** Scopes a person grants the connector on Oxy's consent screen. */
export const READ_SCOPE = 'website.read'
export const WRITE_SCOPE = 'website.write'

/**
 * Maintenance-only tools, absent from the catalog unless switched on for a
 * deploy. They still need an access policy, which the boot check accepts for
 * a disabled tool.
 */
export const OPTIONAL_TOOLS: ReadonlySet<string> = new Set(['debug_upload_test'])

interface CollectedTool extends ToolDefinition {
  domain: string
}

function collectTools(): CollectedTool[] {
  const definitions: CollectedTool[] = []
  const diagnostics = process.env.MCP_ENABLE_DIAGNOSTICS === 'true'
  for (const [domain, register] of TOOL_DOMAINS) {
    const registrar: ToolRegistrar = {
      tool(name, description, shape, handler, options = {}) {
        if (definitions.some((definition) => definition.name === name)) throw new Error(`Duplicate MCP tool: ${name}`)
        if (OPTIONAL_TOOLS.has(name) && !diagnostics) return
        // Every write accepts an idempotency key: that is what the catalog's
        // `idempotency: 'supported'` promises (see idempotency.ts).
        const writes = MCP_TOOL_ACCESS[name]?.kind === 'write'
        definitions.push({
          domain,
          name,
          description,
          shape: writes ? { ...shape, idempotencyKey: idempotencyKeyInput.optional() } : shape,
          options,
          handler: handler as ToolDefinition['handler'],
        })
      },
    }
    register(registrar)
  }
  return definitions
}

export const TOOLS = collectTools()
const TOOLS_BY_NAME = new Map(TOOLS.map((tool) => [tool.name, tool]))

function accessFor(toolName: string): McpToolAccess {
  const access = MCP_TOOL_ACCESS[toolName]
  if (!access) throw new Error(`MCP tool ${toolName} has no access policy in mcpAccess.ts`)
  return access
}

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const converted: Record<string, unknown> = z.toJSONSchema(schema, { target: 'draft-7', io: 'input' })
  delete converted.$schema
  return converted
}

function catalogTool(definition: CollectedTool): CatalogTool {
  const writes = accessFor(definition.name).kind === 'write'
  const effects = effectsFor(definition.name)
  return {
    name: definition.name,
    version: '1.1.0',
    description: definition.description,
    inputSchema: jsonSchema(z.object(definition.shape)),
    ...(definition.options.outputSchema ? { outputSchema: jsonSchema(definition.options.outputSchema) } : {}),
    capabilityPackage: writes ? 'publish' : 'read',
    requiredCapabilities: [writes ? WRITE_SCOPE : READ_SCOPE],
    resourceTypes: ['website_content'],
    effect: writes ? 'write' : 'read',
    idempotency: effects.idempotency,
    rollback: effects.rollback,
    exposure: ['mcp'],
    limitKeys: [],
    // The catalog is exposed to external MCP only; the internal capability lane
    // never invokes this path.
    invocation: { method: 'POST', path: `/_oxy/capabilities/${definition.name}` },
  }
}

function buildCatalog(): AppCapabilityCatalog {
  const unpoliced = Object.keys(MCP_TOOL_ACCESS).filter((name) => !OPTIONAL_TOOLS.has(name) && !TOOLS_BY_NAME.has(name))
  if (unpoliced.length > 0) throw new Error(`MCP access policies without a tool: ${unpoliced.join(', ')}`)
  for (const tool of TOOLS) {
    if (tool.options.localized && !('locale' in tool.shape)) throw new Error(`MCP tool ${tool.name} is localized but takes no locale`)
  }
  return appCapabilityCatalogSchema.parse({
    schemaVersion: '1',
    appId: 'website',
    version: '1.1.0',
    audience: 'website-api',
    internalBaseUrl: new URL(config.mcp.resource).origin,
    accountResourceType: 'oxy_account',
    externalMcp: { resource: config.mcp.resource },
    tools: TOOLS.map(catalogTool),
    events: [],
  })
}

/** Built at import, so a tool missing its policy or schema fails the boot rather than a request. */
export const WEBSITE_MCP_CATALOG = buildCatalog()

export const WEBSITE_MCP_TOOL_NAMES: readonly string[] = TOOLS.map((tool) => tool.name)

// ── Authorization ───────────────────────────────────────────────────────────

export function isWebsiteAdmin(accountId: string): boolean {
  return config.adminUserIds.includes(accountId)
}

function adminOnly(access: McpToolAccess): boolean {
  return access.kind === 'write' || access.kind === 'admin-read'
}

export async function authorize(
  _input: Readonly<Record<string, unknown>>,
  { tool, principal }: CatalogInvocationContext,
): Promise<CatalogMcpAuthorizationDecision> {
  if (adminOnly(accessFor(tool.name)) && !isWebsiteAdmin(principal.activeAccountId)) {
    return { allowed: false, reason: `${tool.name} is only available to website admins` }
  }
  return { allowed: true, effectiveAccountId: principal.activeAccountId }
}

/** Everything a caller needs to know to use the tools without trial and error. */
export function describeAccess(context: ToolContext): Record<string, unknown> {
  const admin = isWebsiteAdmin(context.actorId)
  const domains: Record<string, unknown[]> = {}
  for (const tool of TOOLS) {
    const access = accessFor(tool.name)
    const effects = effectsFor(tool.name)
    const writes = access.kind === 'write'
    ;(domains[tool.domain] ??= []).push({
      name: tool.name,
      available: admin || !adminOnly(access),
      effect: writes ? 'write' : 'read',
      adminOnly: adminOnly(access),
      readerSource: access.kind === 'public-read' ? 'public site API (published content only)' : undefined,
      acceptsIdempotencyKey: writes,
      repeatSafeWithoutKey: effects.repeatSafe,
      undo: effects.rollback === 'manual' ? effects.undo : null,
      supportsDryRun: 'dryRun' in tool.shape,
      supportsExpectedUpdatedAt: 'expectedUpdatedAt' in tool.shape,
      supportsLocale: tool.options.localized === true,
    })
  }
  return {
    account: { role: admin ? 'website-admin' : 'reader', scopes: context.scopes ?? [] },
    rules: [
      'Readers get exactly what the public site serves: published content, through the public API.',
      'A filter a reader cannot use is refused with permission_denied, never silently dropped.',
      'Writes accept idempotencyKey: retrying with the same key and input replays the first result.',
      'Updates accept expectedUpdatedAt; deletes and whole-list replaces accept dryRun.',
    ],
    limits: {
      maxPageSize: MAX_PAGE_SIZE,
      maxBulkItems: MAX_BULK_ITEMS,
      maxImageBytes: 25 * 1024 * 1024,
      maxImagePixels: 40_000_000,
      costUnitsPerMinute: config.mcp.rateLimitPerMinute,
      callCost: TOOL_COST,
    },
    errorCodes: MCP_ERROR_CODES,
    domains,
  }
}

// ── Dispatch ────────────────────────────────────────────────────────────────

/**
 * Answer a non-admin's read from the site's own public route, with no
 * credentials — exactly what an anonymous visitor would receive.
 */
async function readPublicRoute(
  access: Extract<McpToolAccess, { kind: 'public-read' }>,
  input: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ToolResult> {
  let path: string
  try {
    path = access.publicPath(input)
  } catch (error) {
    if (error instanceof PublicReadRefused) return errorOf('permission_denied', error.message)
    throw error
  }
  const timeout = AbortSignal.timeout(15_000)
  const response = await fetch(`http://127.0.0.1:${config.port}/api${path}`, {
    headers: { accept: 'application/json' },
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })
  if (response.status === 404) return errorOf('not_found', 'Not found')
  if (response.status === 400) return errorOf('invalid_request', 'The public API rejected the request')
  if (!response.ok) return errorOf('service_unavailable', `The public API answered ${response.status}`)
  return ok(await response.json())
}

/** Give a success its declared shape: an array result is `{ items }` as structured content. */
function shapeResult(definition: ToolDefinition, result: ToolResult): ToolResult {
  if (result.isError || definition.options.output !== 'items' || result.structuredContent) return result
  const text = result.content[0]?.text
  const items = text === undefined ? [] : JSON.parse(text)
  return Array.isArray(items) ? { ...result, structuredContent: { items } } : result
}

/**
 * Run one tool: validate with its own Zod schema (the catalog's JSON Schema
 * round trip checks shape, but refinements live only here), check a requested
 * locale, hand it the authenticated context, and turn anything thrown into a
 * safe error. Exported for the integration tests, which call it without the
 * transport.
 */
export async function invokeTool(name: string, input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
  const definition = TOOLS_BY_NAME.get(name)
  if (!definition) return errorOf('not_found', `Unknown tool ${name}`)
  const startedAt = Date.now()
  let result: ToolResult
  try {
    const access = accessFor(name)
    await spend(context.actorId, costOf(name, access.kind === 'write'))
    const { idempotencyKey, ...args } = z.object(definition.shape).parse(input) as Record<string, unknown>
    if (definition.options.localized) await resolveReadLocale(args.locale as string | undefined)

    if (access.kind === 'public-read' && !isWebsiteAdmin(context.actorId)) {
      result = await readPublicRoute(access, args, context.signal)
    } else if (adminOnly(access) && !isWebsiteAdmin(context.actorId)) {
      // The transport's `authorize` already refuses this; kept so no other
      // caller of invokeTool can reach an admin handler.
      result = errorOf('permission_denied', `${name} is only available to website admins`)
    } else {
      const run = async () => {
        try {
          return await definition.handler(args, context)
        } catch (error) {
          return toolError(error)
        }
      }
      result = typeof idempotencyKey === 'string'
        ? await withIdempotency({ accountId: context.actorId, tool: name, key: idempotencyKey, input: args }, run)
        : await run()
    }
    result = shapeResult(definition, result)
    if (!result.isError && definition.options.outputSchema && result.structuredContent) {
      definition.options.outputSchema.parse(result.structuredContent)
    }
  } catch (error) {
    result = toolError(error)
  }
  const code = result.isError ? (result.structuredContent as { error?: { code?: string } } | undefined)?.error?.code : undefined
  const bytes = result.content.reduce((total, block) => total + Buffer.byteLength(block.text), 0)
  console.log(`[mcp:call] ${JSON.stringify({ tool: name, actor: context.actorId, request: context.requestId, ok: !result.isError, code, ms: Date.now() - startedAt, bytes })}`)
  return result
}

export const handlers: CatalogToolHandlers = Object.fromEntries(TOOLS.map((definition) => [
  definition.name,
  async (input: Readonly<Record<string, unknown>>, context: CatalogInvocationContext): Promise<CatalogToolResult> =>
    invokeTool(definition.name, { ...input }, {
      actorId: context.principal.activeAccountId,
      scopes: context.principal.scopes,
      signal: context.request.signal,
      requestId: context.request.requestId,
    }),
]))
