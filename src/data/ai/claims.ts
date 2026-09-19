/**
 * The claims registry.
 *
 * Every load-bearing public statement the AI pages make about data handling,
 * availability, hosting or commercial terms is registered here with its exact
 * scope, the person who owns the evidence, and the date the claim has to be
 * looked at again. `scripts/ai-claims.test.ts` runs in `prebuild` and fails the
 * build when a claim has no owner, has passed its review date, or when a page
 * uses one of the prohibited terms outside a registered, scoped claim.
 *
 * This exists because the failure mode it guards against is silent. The page it
 * replaced said Oxy AI conversations "never train anyone else" — true of Oxy's
 * own handling, unknowable for every third-party route the platform can reach,
 * and nothing in the codebase could tell the difference.
 *
 * Adding a claim is not the same as approving it. `status: 'approved'` means a
 * named owner has the evidence; `draft` keeps a claim out of published copy.
 */

export type ClaimStatus = 'approved' | 'draft' | 'retired'

/** How wide the statement is. Getting this wrong is the whole failure mode. */
export type ClaimScope =
  /** True of Oxy's own systems, regardless of which model is called. */
  | 'oxy_platform'
  /** True only of a specific serving route, and stated with that route named. */
  | 'per_route'
  /** True only under a signed contract. */
  | 'contractual'
  /** A statement about a product (Alia, Codea), not about the platform. */
  | 'product'

export interface Claim {
  id: string
  /** The statement as it is allowed to be published, verbatim. */
  text: string
  scope: ClaimScope
  /** Who holds the evidence. A team, so it survives a person leaving. */
  evidenceOwner: string
  /** ISO date. After this the claim is unpublishable until it is re-checked. */
  reviewBy: string
  status: ClaimStatus
  /** Where the claim is rendered, for the reviewer. */
  surfaces: readonly string[]
  /** Why it is scoped the way it is. */
  note?: string
}

/**
 * Words and phrases that may not appear in AI copy unqualified.
 *
 * Each is either route-specific or contractual, and each of them was chosen
 * because the unqualified form is a claim nobody at Oxy is in a position to
 * make about every model the platform can route to.
 */
export const PROHIBITED_UNQUALIFIED_TERMS: readonly string[] = [
  'zero retention',
  'zero-retention',
  'no training',
  'never trains',
  'self-hosted',
  'self-host',
  'EU hosted',
  'EU-only',
  'unlimited',
  'SOC 2',
  'HIPAA',
  'ISO 27001',
  'guaranteed uptime',
  '99.9%',
  '99.99%',
  'bank-grade',
  'military-grade',
]

/**
 * Phrases that make a prohibited term acceptable by naming what it applies to.
 *
 * The test treats a prohibited term as registered when the surrounding sentence
 * carries one of these, which is what turns "zero retention" from a platform
 * promise into a property of a route.
 */
export const SCOPE_QUALIFIERS: readonly string[] = [
  'where the route',
  'on routes that',
  'per route',
  'route-level',
  'under contract',
  'contractually',
  'when a deployment',
  'for deployments that',
  'this deployment',
]

export const claims: readonly Claim[] = [
  {
    id: 'inference-availability',
    text: 'Oxy Inference is in private preview. Access is granted per organization.',
    scope: 'oxy_platform',
    evidenceOwner: 'Oxy Platform',
    reviewBy: '2027-03-31',
    status: 'approved',
    surfaces: ['/ai', '/ai/inference', '/ai/models', '/ai/pricing', 'navigation'],
    note:
      'Moves to `available` only after the API, credentials, billing and commercial route gates in docs/AI-CONTENT-ARCHITECTURE.md §7 pass. One constant: OXY_INFERENCE_AVAILABILITY.',
  },
  {
    id: 'no-second-control-plane',
    text: 'Accounts, applications, credentials, limits and billing live in Oxy Console. This site links to them and stores none of them.',
    scope: 'oxy_platform',
    evidenceOwner: 'Oxy Platform',
    reviewBy: '2027-03-31',
    status: 'approved',
    surfaces: ['/ai', '/ai/inference', '/ai/pricing', '/ai/enterprise'],
  },
  {
    id: 'oxy-own-handling',
    text: 'Oxy does not use content sent through the inference API to train Oxy models.',
    scope: 'oxy_platform',
    evidenceOwner: 'Oxy Legal',
    reviewBy: '2027-03-31',
    status: 'approved',
    surfaces: ['/ai/trust', '/ai'],
    note:
      'Deliberately about OXY. It says nothing about what an upstream provider does with a routed request; that is per-route metadata and is stated per route.',
  },
  {
    id: 'route-policy-disclosure',
    text: 'Every route can disclose the serving provider, the region, the retention window and the training policy that applies to it.',
    scope: 'per_route',
    evidenceOwner: 'Oxy Platform',
    reviewBy: '2027-03-31',
    status: 'approved',
    surfaces: ['/ai/trust', '/ai/models'],
    note: 'The disclosure is a property of the catalogue record, not a promise about its contents.',
  },
  {
    id: 'zero-retention-per-route',
    text: 'Zero data retention is available where the route is contractually zero-retention, and the catalogue marks which routes those are.',
    scope: 'per_route',
    evidenceOwner: 'Oxy Legal',
    reviewBy: '2027-03-31',
    status: 'approved',
    surfaces: ['/ai/trust', '/ai/models'],
    note: 'Never rendered as a platform-wide property. The qualifier is part of the sentence.',
  },
  {
    id: 'no-ip-retention',
    text: 'Oxy does not store visitor IP addresses, raw, hashed or turned into a location.',
    scope: 'oxy_platform',
    evidenceOwner: 'Oxy Platform',
    reviewBy: '2027-03-31',
    status: 'approved',
    surfaces: ['/ai/trust', '/contact/sales'],
    note: 'Matches the platform-wide no-IP invariant the rest of the Oxy stack holds to.',
  },
  {
    id: 'alia-models-unreleased',
    text: 'Alia Models has no released model. There is no artifact, revision, benchmark, context length or date to publish yet.',
    scope: 'product',
    evidenceOwner: 'Alia',
    reviewBy: '2027-03-31',
    status: 'approved',
    surfaces: ['/ai'],
    note:
      'The retired aliases alia-v1, alia-v1-pro and alia-lite are not models and are never listed as such.',
  },
  {
    id: 'enterprise-terms-undefined',
    text: 'Support levels, service-level agreements and compliance certifications are agreed per contract and are not published as platform defaults.',
    scope: 'contractual',
    evidenceOwner: 'Oxy Legal',
    reviewBy: '2027-03-31',
    status: 'approved',
    surfaces: ['/ai/enterprise', '/enterprise', '/ai/trust'],
  },
  {
    id: 'pricing-source',
    text: 'Inference prices come from the Oxy pricing source with a published price version. The site never restates a price of its own.',
    scope: 'oxy_platform',
    evidenceOwner: 'Oxy Platform',
    reviewBy: '2027-03-31',
    status: 'approved',
    surfaces: ['/ai/pricing', '/ai/models'],
  },
  {
    id: 'alia-plans-elsewhere',
    text: 'Alia product plans are sold by Alia. This site links to them and does not render them as inference pricing.',
    scope: 'product',
    evidenceOwner: 'Alia',
    reviewBy: '2027-03-31',
    status: 'approved',
    surfaces: ['/ai/pricing', '/pricing'],
  },
]

export function approvedClaims(): Claim[] {
  return claims.filter((claim) => claim.status === 'approved')
}

export function claimById(id: string): Claim | undefined {
  return claims.find((claim) => claim.id === id)
}
