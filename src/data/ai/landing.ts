/**
 * Editorial copy for `/ai`, the Oxy AI umbrella landing.
 *
 * English is the canonical source for this copy; the chrome-level strings that
 * every locale needs (titles, descriptions, section headings, CTA labels) live
 * in `src/lib/i18n/locales/**` and are read through `useTranslation`. What is
 * here is the explanatory body copy, which stays in one language until there is
 * a reviewer per locale for the claims it carries — a mistranslated data-policy
 * sentence is a legal problem, not a typo.
 *
 * Nothing in this file states a price, a model name, a provider, a region, a
 * certification or a date. Those are operational facts and come from the
 * catalogue snapshot.
 */

export interface RoutingCapability {
  key: string
  title: string
  description: string
  /** What the site can honestly say about this today. */
  state: 'implemented' | 'planned'
}

/**
 * What the platform does between a request and a model.
 *
 * Each entry carries its own state rather than the section carrying one, so a
 * capability that ships does not need the paragraph around it rewritten — and
 * so nothing here reads as a promise that everything listed already works.
 */
export const routingCapabilities: RoutingCapability[] = [
  {
    key: 'unified-api',
    title: 'One API and one credential',
    description:
      'The same request shape reaches every model the platform is approved to serve. Credentials are issued in Oxy Console and scoped to an application.',
    state: 'planned',
  },
  {
    key: 'unified-billing',
    title: 'One bill',
    description:
      'Usage from every model lands on one Oxy invoice instead of one contract per provider.',
    state: 'planned',
  },
  {
    key: 'allowlists',
    title: 'Provider allowlists and denylists',
    description:
      'Name the providers a workload may reach, or the ones it may not, and the router respects it rather than optimising past it.',
    state: 'planned',
  },
  {
    key: 'residency',
    title: 'Region constraints',
    description:
      'Restrict an application to deployments in named regions. A request that cannot be served inside the constraint fails rather than leaving it.',
    state: 'planned',
  },
  {
    key: 'price-ceiling',
    title: 'Price ceilings',
    description:
      'Cap what a single request is allowed to cost, so a routing decision cannot quietly become an expensive one.',
    state: 'planned',
  },
  {
    key: 'routing-policy',
    title: 'Routing by price, latency or throughput',
    description:
      'Choose the policy a profile optimises for. A profile is a policy over models — it is never itself a model.',
    state: 'planned',
  },
  {
    key: 'same-model-fallback',
    title: 'Same-model fallback',
    description:
      'When one deployment of a model is unavailable, another deployment of the same model takes the request.',
    state: 'planned',
  },
  {
    key: 'cross-model-fallback',
    title: 'Cross-model fallback, only when authorised',
    description:
      'Falling back to a different model changes the answer, so it happens only where an application has explicitly allowed it.',
    state: 'planned',
  },
  {
    key: 'zdr-routing',
    title: 'Retention constraints',
    description:
      'Restrict an application to deployments whose route-level policy meets the retention rule you set.',
    state: 'planned',
  },
  {
    key: 'byok',
    title: 'Bring your own key',
    description:
      'Use your own provider contract through the same API, so the commercial relationship stays yours and the integration does not change.',
    state: 'planned',
  },
  {
    key: 'attribution',
    title: 'Usage attribution',
    description:
      'Every request is attributed to the application and credential that made it, so cost has an owner before the invoice arrives.',
    state: 'planned',
  },
  {
    key: 'budgets',
    title: 'Budgets and limits',
    description: 'Per-application spend limits and rate limits, configured in Oxy Console.',
    state: 'planned',
  },
]

export interface InfrastructureTier {
  key: string
  title: string
  description: string
}

/** Routed, managed and dedicated, told apart in the visitor's terms. */
export const infrastructureTiers: InfrastructureTier[] = [
  {
    key: 'routed',
    title: 'Routed third-party inference',
    description:
      'Oxy sends the request to a provider Oxy is approved to resell. The provider serves it, and the route discloses who that was, in which region, under which policy.',
  },
  {
    key: 'managed',
    title: 'Managed inference',
    description:
      'Oxy serves the model on infrastructure Oxy operates. The serving path is known rather than chosen per request, which is what a placement or policy constraint usually needs.',
  },
  {
    key: 'dedicated',
    title: 'Dedicated inference',
    description:
      'A private endpoint with capacity reserved for one organization, sized and contracted rather than shared. Custom and fine-tuned serving is discussed here, not ordered from a page.',
  },
]

export const trustSummary = {
  heading: 'What happens to what you send',
  /** Oxy's own handling. Scoped deliberately — see the claims registry. */
  oxyStatement:
    'Oxy does not use content sent through the inference API to train Oxy models, and does not store visitor IP addresses.',
  /** The upstream half, which is a different statement about different parties. */
  routeStatement:
    'A routed request is served by a provider with its own policy. That policy is a property of the route, so every route can disclose its provider, its region, its retention window and whether the upstream may train on content.',
  constraintStatement:
    'Where an application sets provider, region or retention constraints, the router applies them instead of optimising past them.',
}

export const pricingSummary = {
  heading: 'What it costs',
  payg:
    'Inference is priced per model and per unit — input, cached input, output and, where a model uses them, reasoning and multimodal units. Prices come from the Oxy pricing source with a published price version; this site never restates one of its own.',
  enterprise:
    'Managed and dedicated capacity is priced per agreement, because it is capacity rather than usage.',
  aliaNote:
    'Looking for Alia plans? Alia is a product with its own subscription, sold by Alia. Its plans are not inference pricing and are not shown here.',
}

export const aliaModelsPreview = {
  heading: 'Alia Models',
  body:
    'Oxy intends to publish its own models. Nothing is released yet, so there is no artifact, no revision, no benchmark, no context length and no date to quote — and the earlier names that circulated were routing aliases, not models.',
  commitment:
    'When a release exists it will arrive the same way any other model does: an artifact with an immutable revision, a model card, published evaluations, provenance and a licence, listed through the Oxy catalogue rather than as website-only copy.',
}

export const productsOnPlatform = {
  heading: 'Products built on Oxy AI',
  body:
    'Oxy builds its own products on the same platform it sells. That is why Alia and Codea exist here as products with their own pages and their own pricing — and why neither of them owns the infrastructure underneath.',
}
