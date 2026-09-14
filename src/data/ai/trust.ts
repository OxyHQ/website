/**
 * Editorial copy for `/ai/trust`.
 *
 * Every statement on this page is one of two kinds, and the page never lets
 * them blur:
 *
 *   • **Oxy's own handling** — what Oxy's systems do, true regardless of which
 *     model a request reaches.
 *   • **Route policy** — what the provider serving a particular request does,
 *     which is a property of that route and is disclosed per route.
 *
 * The page this replaced made the first kind of statement with the second
 * kind's scope ("conversations that never train anyone else"), which is a claim
 * about every third-party provider the platform can reach.
 *
 * Each section carries an owner and a review date, rendered on the page, so a
 * reader can see how old the answer is and a reviewer can see what is theirs.
 */

export type TrustScope = 'oxy' | 'route' | 'contract'

export interface TrustStatement {
  id: string
  heading: string
  scope: TrustScope
  body: string
  /** Team that holds the evidence for this statement. */
  owner: string
  /** ISO date this statement has to be re-checked by. */
  reviewBy: string
}

export const trustStatements: TrustStatement[] = [
  {
    id: 'oxy-training',
    heading: 'Training on your content',
    scope: 'oxy',
    body:
      'Oxy does not use content sent through the inference API to train Oxy models. That is a statement about Oxy. It is not a statement about an upstream provider serving a routed request — that is route policy, and it is published per route.',
    owner: 'Oxy Legal',
    reviewBy: '2027-03-31',
  },
  {
    id: 'oxy-retention',
    heading: 'What Oxy keeps',
    scope: 'oxy',
    body:
      'Oxy keeps the metering record a request produces — which application called, which model and deployment served it, how many units it consumed and what it cost — because that is what an invoice and a usage report are made of. Prompt and response bodies are not part of that record.',
    owner: 'Oxy Platform',
    reviewBy: '2027-03-31',
  },
  {
    id: 'route-policy',
    heading: 'Provider routing and what it implies',
    scope: 'route',
    body:
      'A routed request is served by a third party, and that party is a subprocessor for the request. Every route can disclose the serving provider, the region it serves from, the retention window that applies and whether the upstream may train on content. Those four facts are catalogue data, shown on the model, not a promise made here.',
    owner: 'Oxy Platform',
    reviewBy: '2027-03-31',
  },
  {
    id: 'retention-constraints',
    heading: 'Retention constraints',
    scope: 'route',
    body:
      'Zero data retention is available where the route is contractually zero-retention. Not every model has such a route, and a constraint that cannot be satisfied fails the request rather than quietly serving it somewhere else. The catalogue marks which deployments qualify.',
    owner: 'Oxy Legal',
    reviewBy: '2027-03-31',
  },
  {
    id: 'byok-security',
    heading: 'Bring your own key',
    scope: 'oxy',
    body:
      'A provider key you connect is held to call that provider on your behalf and is never returned through the API, echoed into a response, or sent to another provider. It is revocable from Oxy Console, and revoking it takes effect on the next request.',
    owner: 'Oxy Platform',
    reviewBy: '2027-03-31',
  },
  {
    id: 'regions',
    heading: 'Regions and data residency',
    scope: 'route',
    body:
      'Residency is a property of the deployment that serves a request. An application can be constrained to deployments in named regions; which regions exist for a given model is catalogue data, and this page does not list regions the catalogue has not published.',
    owner: 'Oxy Platform',
    reviewBy: '2027-03-31',
  },
  {
    id: 'encryption',
    heading: 'Encryption',
    scope: 'oxy',
    body:
      'Traffic to the API is TLS-encrypted, and the operational records behind it are stored encrypted at rest by the managed services that hold them.',
    owner: 'Oxy Platform',
    reviewBy: '2027-03-31',
  },
  {
    id: 'logging',
    heading: 'Logging and redaction',
    scope: 'oxy',
    body:
      'Prompt and response bodies are not written to ordinary infrastructure logs. Oxy does not store visitor IP addresses — not raw, not hashed, and not turned into a location — anywhere in this stack, which is the same invariant the rest of the Oxy platform holds to.',
    owner: 'Oxy Platform',
    reviewBy: '2027-03-31',
  },
  {
    id: 'deletion',
    heading: 'Deletion, export and contact',
    scope: 'oxy',
    body:
      'Account and usage data is exported and deleted through Oxy Console and the account deletion path. A sales inquiry submitted on this site is a separate record with its own retention rule, stated on the form.',
    owner: 'Oxy Platform',
    reviewBy: '2027-03-31',
  },
  {
    id: 'contracts',
    heading: 'Agreements and certifications',
    scope: 'contract',
    body:
      'Data processing agreements, subprocessor lists, service levels and certifications are agreed per contract and published when they exist. This page does not carry a badge for something that has not been audited.',
    owner: 'Oxy Legal',
    reviewBy: '2027-03-31',
  },
  {
    id: 'licences',
    heading: 'Model licences and attribution',
    scope: 'route',
    body:
      'A model carries its publisher, its licence and any attribution the licence requires. Those travel with the catalogue entry and are shown on the model page, because an obligation that is only in a contract is one a developer cannot comply with.',
    owner: 'Oxy Legal',
    reviewBy: '2027-03-31',
  },
  {
    id: 'security-contact',
    heading: 'Reporting a security problem',
    scope: 'oxy',
    body:
      'Security reports reach Oxy through the security contact published in the platform documentation and are acknowledged before they are triaged.',
    owner: 'Oxy Platform',
    reviewBy: '2027-03-31',
  },
]

export const trustIntro = {
  heading: 'Data, policy and what applies where',
  body:
    'Two different things get called "our privacy policy" on an inference platform: what Oxy does with what you send, and what the provider serving a particular request does with it. They are separate, and mixing them produces a promise nobody can keep. Each statement below says which of the two it is.',
}

export const trustScopeLabels: Record<TrustScope, string> = {
  oxy: "Oxy's own handling",
  route: 'Depends on the route',
  contract: 'Agreed per contract',
}

/** Legal documents linked from the page, with only the ones that exist. */
export const trustDocumentLinks: ReadonlyArray<{ label: string; href: string }> = [
  { label: 'Privacy policy', href: '/legal/privacy' },
  { label: 'Terms and conditions', href: '/legal/terms' },
  { label: 'How Oxy uses large language models', href: '/legal/llms' },
  { label: 'Account deletion', href: '/account-deletion' },
]
