/**
 * The public Oxy AI taxonomy, as one list.
 *
 * Every service card, navigation entry and cross-link on the AI pages is built
 * from this file, so the six things below cannot drift apart across surfaces —
 * which is how `/ai` ended up describing the platform as "Alia, an API card and
 * a duplicate docs card" in the first place.
 *
 * The availability states here are **editorial and conservative on purpose**.
 * Nothing in this repository can verify that a service is open for self-service
 * purchase, so the site says `private_preview` until the release gates in
 * `docs/AI-CONTENT-ARCHITECTURE.md` §7 are recorded as passed. Flipping a
 * service to `available` is a one-line edit here plus a claims-registry entry —
 * deliberately a decision someone makes, never a side effect of a page shipping.
 */
import type { Availability } from '../../lib/ai/availability'

/**
 * The state of the public inference service, named once.
 *
 * `/ai`, `/ai/inference`, `/ai/models`, `/ai/pricing`, the navigation and the
 * quickstart all read this constant, so the site cannot advertise a preview in
 * one place and a purchase in another.
 */
export const OXY_INFERENCE_AVAILABILITY: Availability = 'private_preview'

/** Where self-service configuration and billing actually happen. */
export const CONSOLE_URL = 'https://console.oxy.so'

/** Console deep links. A target that is not deployed yet falls back to the root. */
export const consoleLinks = {
  root: CONSOLE_URL,
  createApplication: `${CONSOLE_URL}/applications/new`,
  applications: `${CONSOLE_URL}/applications`,
  createCredential: `${CONSOLE_URL}/credentials/new`,
  playground: `${CONSOLE_URL}/playground`,
  models: `${CONSOLE_URL}/models`,
  usage: `${CONSOLE_URL}/usage`,
  billing: `${CONSOLE_URL}/billing`,
  routing: `${CONSOLE_URL}/routing`,
  providerConnections: `${CONSOLE_URL}/providers`,
} as const

export type ConsoleLink = keyof typeof consoleLinks

/** The base URL the published quickstarts call. */
export const INFERENCE_API_BASE = 'https://api.oxy.so/v1'

export type ServiceAudience = 'developers' | 'organizations' | 'people'

export interface AiService {
  /** Stable key, used for anchors and analytics event names. */
  key: string
  name: string
  /** One line: what it is. */
  summary: string
  /** One line: who it is for. */
  audience: ServiceAudience
  audienceLabel: string
  availability: Availability
  /** Where the card's primary action goes. */
  href: string
  /** True when `href` leaves the site. */
  external?: boolean
  /** Secondary link, usually documentation for the service. */
  docs?: { label: string; href: string; external?: boolean }
}

/**
 * The umbrella's members, in the order `/ai` presents them.
 *
 * `Developer Docs` is deliberately absent: documentation is a link on the
 * service it documents, not a product standing beside it.
 */
export const aiServices: AiService[] = [
  {
    key: 'oxy-inference',
    name: 'Oxy Inference',
    summary:
      'One API, one credential and one bill for every model Oxy is approved to serve, with routing and usage attribution per application.',
    audience: 'developers',
    audienceLabel: 'For developers and teams building on the API',
    availability: OXY_INFERENCE_AVAILABILITY,
    href: '/ai/inference',
    docs: { label: 'Read the quickstart', href: '/ai/inference#quickstart' },
  },
  {
    key: 'managed-inference',
    name: 'Managed Inference',
    summary:
      'Selected models served on infrastructure Oxy operates, for teams that need the serving path itself to be known rather than routed.',
    audience: 'organizations',
    audienceLabel: 'For teams with placement or policy constraints',
    availability: 'private_preview',
    href: '/ai/enterprise#managed',
  },
  {
    key: 'dedicated-inference',
    name: 'Dedicated Inference',
    summary:
      'Private endpoints and reserved capacity, sized and contracted per organization rather than shared.',
    audience: 'organizations',
    audienceLabel: 'For production workloads with capacity commitments',
    availability: 'private_preview',
    href: '/ai/enterprise#dedicated',
  },
  {
    key: 'alia',
    name: 'Alia',
    summary:
      'The assistant for people and teams. A product built on the platform, with its own plans and its own surfaces.',
    audience: 'people',
    audienceLabel: 'For everyone',
    availability: 'available',
    href: 'https://alia.onl/',
    external: true,
  },
  {
    key: 'codea',
    name: 'Codea',
    summary:
      'The coding and agent product: an open-source editor and a VS Code extension that read and write real repositories.',
    audience: 'people',
    audienceLabel: 'For developers writing code',
    availability: 'available',
    href: '/codea',
  },
  {
    key: 'alia-models',
    name: 'Alia Models',
    summary:
      'A future family of Oxy-published models. Nothing is released yet, so there is no artifact, revision, benchmark or date to quote.',
    audience: 'developers',
    audienceLabel: 'For anyone tracking what Oxy publishes itself',
    availability: 'coming_soon',
    href: '/ai#alia-models',
  },
]

export function serviceByKey(key: string): AiService | undefined {
  return aiServices.find((service) => service.key === key)
}

/** Retired model aliases the site must never present as Alia-owned models. */
export const RETIRED_MODEL_ALIASES: readonly string[] = ['alia-v1', 'alia-v1-pro', 'alia-lite']
