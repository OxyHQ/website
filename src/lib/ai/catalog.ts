/**
 * The customer-safe public catalogue contract.
 *
 * This is the ONE schema for every operational fact the AI pages render: which
 * publishers and models exist, which revisions they have, which providers and
 * deployments serve them, what each costs, what policy applies and whether any
 * of it is actually purchasable. Pages never declare a model or a price inline
 * — see `docs/AI-CONTENT-ARCHITECTURE.md` §4.
 *
 * Three properties of the schema are load-bearing:
 *
 *  1. **Versioned.** An unknown `schemaVersion` is REJECTED rather than parsed
 *     leniently. Half-understood catalogue data renders as confident,
 *     wrong-shaped product information, which is worse than an empty page.
 *  2. **Customer-safe by construction.** There is no field for a wholesale
 *     cost, a provider credential, an internal route id or a private contract,
 *     so an upstream that leaks one has it dropped at the boundary rather than
 *     printed. `assertNoInternalLeakage` is the belt to that braces.
 *  3. **Money is a decimal string, never a number.** `0.1 + 0.2` is the reason.
 *     `src/lib/ai/estimator.ts` does the arithmetic in integers.
 */
import { z } from 'zod'
import { AVAILABILITY_STATES, isPubliclyListable } from './availability'

/**
 * The schema version this build understands. Bumped only alongside a change to
 * the shapes below; the ingestion script refuses anything else.
 */
export const CATALOG_SCHEMA_VERSION = 1

/** A decimal amount as written, e.g. `"0.60"`. Never parsed as a float here. */
const decimalString = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'expected a non-negative decimal written as a string')

const availabilitySchema = z.enum(AVAILABILITY_STATES)

/**
 * The units a public price can be quoted in. Anything else is a unit this site
 * does not know how to label, and labelling it wrong is a pricing error.
 */
export const PRICE_UNITS = [
  'input_token',
  'cached_input_token',
  'output_token',
  'reasoning_token',
  'embedding_token',
  'audio_second',
  'image',
  'request',
  'rerank_document',
] as const
export type PriceUnit = (typeof PRICE_UNITS)[number]

export const unitPriceSchema = z.object({
  unit: z.enum(PRICE_UNITS),
  /**
   * USD per 1,000,000 units for token-like units, per unit otherwise. The
   * multiplier is part of the unit's definition rather than a per-row field so
   * two rows can never disagree about what "per million" meant.
   */
  amountUsd: decimalString,
  /** Set when the price depends on which deployment serves the request. */
  deploymentId: z.string().min(1).optional(),
})
export type UnitPrice = z.infer<typeof unitPriceSchema>

export const capabilitySchema = z.enum([
  'text',
  'tools',
  'structured_output',
  'vision',
  'audio_input',
  'audio_output',
  'image_generation',
  'embeddings',
  'reranking',
  'reasoning',
  'batch',
])
export type Capability = z.infer<typeof capabilitySchema>

export const dataPolicySchema = z.object({
  /** Whether the SERVING ROUTE retains prompts, and for how long if it does. */
  retention: z.enum(['none', 'transient', 'retained', 'unknown']),
  retentionWindowDays: z.number().int().nonnegative().optional(),
  /** Whether the upstream may train on content sent through this route. */
  trainsOnContent: z.enum(['no', 'yes', 'opt_out_available', 'unknown']),
  /** True only where the route is contractually zero-data-retention. */
  zeroRetentionAvailable: z.boolean(),
  /** Free-text scope note, rendered verbatim and escaped. */
  note: z.string().max(500).optional(),
})
export type DataPolicy = z.infer<typeof dataPolicySchema>

export const publisherSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Canonical site for the publisher, used for attribution. */
  url: z.string().url().optional(),
})
export type Publisher = z.infer<typeof publisherSchema>

export const servingProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
})
export type ServingProvider = z.infer<typeof servingProviderSchema>

export const deploymentSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  /** Where the request is served, as a customer-facing region label. */
  region: z.string().min(1),
  /** `shared` routes third-party capacity; `managed`/`dedicated` are Oxy-served. */
  kind: z.enum(['shared', 'managed', 'dedicated']),
  availability: availabilitySchema,
  dataPolicy: dataPolicySchema,
})
export type Deployment = z.infer<typeof deploymentSchema>

export const revisionSchema = z.object({
  /** Immutable, pinnable id, e.g. `2026-04-01`. */
  id: z.string().min(1),
  releasedAt: z.string().optional(),
  availability: availabilitySchema,
})
export type Revision = z.infer<typeof revisionSchema>

/**
 * A model or a routing profile. They share a route shape and a card shape, and
 * `kind` is what keeps them from being rendered as the same thing: a routing
 * profile is a policy over models, and showing `Balanced` in a model list as if
 * it were a model is the exact confusion this field exists to prevent.
 */
export const catalogEntrySchema = z.object({
  kind: z.enum(['model', 'routing_profile']),
  /** Canonical, copy-pasteable API id, e.g. `openai/gpt-4o-mini`. */
  id: z.string().min(1),
  publisherId: z.string().min(1),
  name: z.string().min(1),
  family: z.string().min(1).optional(),
  description: z.string().max(2000),
  availability: availabilitySchema,
  /** Whether the entry may be shown with a self-service purchase CTA. */
  commercial: z.enum(['public_payg', 'enterprise', 'private_preview', 'internal_only']),
  capabilities: z.array(capabilitySchema).default([]),
  contextTokens: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  revisions: z.array(revisionSchema).default([]),
  deploymentIds: z.array(z.string().min(1)).default([]),
  prices: z.array(unitPriceSchema).default([]),
  license: z.string().max(200).optional(),
  attribution: z.string().max(500).optional(),
  /** Provenance for a derived model: the base it was trained from. */
  baseModelId: z.string().optional(),
  modelCardUrl: z.string().url().optional(),
  evaluationsUrl: z.string().url().optional(),
  limitations: z.array(z.string().max(300)).default([]),
  deprecation: z
    .object({
      sunsetAt: z.string().optional(),
      replacementId: z.string().optional(),
      note: z.string().max(300).optional(),
    })
    .optional(),
})
export type CatalogEntry = z.infer<typeof catalogEntrySchema>

export const publicCatalogSchema = z.object({
  schemaVersion: z.literal(CATALOG_SCHEMA_VERSION),
  /** When the snapshot was produced upstream. Rendered as the freshness stamp. */
  generatedAt: z.string(),
  /** Which published price list the `prices` below belong to. */
  priceVersion: z.string(),
  /** Where the data came from, for the stale-data notice and for debugging. */
  source: z.enum(['oxy-control-plane', 'placeholder']),
  publishers: z.array(publisherSchema).default([]),
  providers: z.array(servingProviderSchema).default([]),
  deployments: z.array(deploymentSchema).default([]),
  entries: z.array(catalogEntrySchema).default([]),
})
export type PublicCatalog = z.infer<typeof publicCatalogSchema>

export class CatalogSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CatalogSchemaError'
  }
}

/**
 * Parse an untrusted catalogue payload.
 *
 * A wrong `schemaVersion` is reported as its own failure rather than as a pile
 * of field errors, because the two need different responses: a field error is a
 * bug upstream, a version mismatch means this build must not render the data at
 * all until it is taught the new shape.
 */
export function parsePublicCatalog(input: unknown): PublicCatalog {
  if (typeof input !== 'object' || input === null) {
    throw new CatalogSchemaError('catalogue payload is not an object')
  }
  const version = (input as { schemaVersion?: unknown }).schemaVersion
  if (version !== CATALOG_SCHEMA_VERSION) {
    throw new CatalogSchemaError(
      `unsupported catalogue schemaVersion ${String(version)} — this build understands ${CATALOG_SCHEMA_VERSION}`,
    )
  }
  const result = publicCatalogSchema.safeParse(input)
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ')
    throw new CatalogSchemaError(`catalogue failed validation — ${issues}`)
  }
  return result.data
}

/**
 * Drop everything a visitor must not see, and everything that would dangle once
 * it is dropped.
 *
 * Two filters, not one: an entry can be `available` technically while its
 * commercial permission is `internal_only`, and it is the commercial field that
 * decides whether it may be listed for sale. Deployments are filtered on the
 * same rule, then entries lose references to deployments that did not survive —
 * a model row citing a deployment that is not in the payload renders as a blank
 * region, which reads as "no region" rather than "withheld".
 */
export function toCustomerSafeCatalog(catalog: PublicCatalog): PublicCatalog {
  const deployments = catalog.deployments.filter((deployment) =>
    isPubliclyListable(deployment.availability),
  )
  const deploymentIds = new Set(deployments.map((deployment) => deployment.id))
  const entries = catalog.entries
    .filter(
      (entry) => isPubliclyListable(entry.availability) && entry.commercial !== 'internal_only',
    )
    .map((entry) => ({
      ...entry,
      deploymentIds: entry.deploymentIds.filter((id) => deploymentIds.has(id)),
      prices: entry.prices.filter(
        (price) => price.deploymentId === undefined || deploymentIds.has(price.deploymentId),
      ),
    }))
  const publisherIds = new Set(entries.map((entry) => entry.publisherId))
  const providerIds = new Set(deployments.map((deployment) => deployment.providerId))
  return {
    ...catalog,
    publishers: catalog.publishers.filter((publisher) => publisherIds.has(publisher.id)),
    providers: catalog.providers.filter((provider) => providerIds.has(provider.id)),
    deployments,
    entries,
  }
}

/**
 * Field names that must never appear anywhere in a published snapshot, at any
 * depth. The schema already drops unknown keys, so this is the guard for the
 * path that does NOT go through the schema: a snapshot file edited by hand, or
 * a future field added without thinking about what it carries.
 */
const FORBIDDEN_KEYS: readonly string[] = [
  'apiKey',
  'api_key',
  'secret',
  'token',
  'credential',
  'credentials',
  'wholesaleCost',
  'wholesale_cost',
  'cost',
  'margin',
  'internalRouteId',
  'internal_route_id',
  'contract',
  'upstreamKey',
]

/** Throws when a payload carries a secret, an internal cost or an internal-only object. */
export function assertNoInternalLeakage(value: unknown, path = '$'): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoInternalLeakage(item, `${path}[${index}]`))
    return
  }
  if (typeof value !== 'object' || value === null) return
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.includes(key)) {
      throw new CatalogSchemaError(`snapshot carries a non-public field at ${path}.${key}`)
    }
    if (key === 'availability' || key === 'commercial') {
      if (child === 'internal_only') {
        throw new CatalogSchemaError(`snapshot carries an internal_only object at ${path}`)
      }
    }
    assertNoInternalLeakage(child, `${path}.${key}`)
  }
}

/* ── Derived views the pages share ─────────────────────────────────────── */

export function entriesForListing(catalog: PublicCatalog): CatalogEntry[] {
  return [...catalog.entries].sort((a, b) => a.id.localeCompare(b.id))
}

export function findEntry(catalog: PublicCatalog, id: string): CatalogEntry | undefined {
  return catalog.entries.find((entry) => entry.id === id)
}

export function publisherName(catalog: PublicCatalog, publisherId: string): string {
  return catalog.publishers.find((publisher) => publisher.id === publisherId)?.name ?? publisherId
}

export function deploymentsForEntry(catalog: PublicCatalog, entry: CatalogEntry): Deployment[] {
  return entry.deploymentIds
    .map((id) => catalog.deployments.find((deployment) => deployment.id === id))
    .filter((deployment): deployment is Deployment => deployment !== undefined)
}

export function regionsForEntry(catalog: PublicCatalog, entry: CatalogEntry): string[] {
  return [...new Set(deploymentsForEntry(catalog, entry).map((deployment) => deployment.region))]
}
