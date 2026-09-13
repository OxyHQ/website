/**
 * Editorial copy for `/ai/enterprise` and the cross-Oxy `/enterprise` hub.
 *
 * The hard rule in this file: nothing here states a support-response time, a
 * service-level agreement, a certification or an uptime figure. Those are
 * contractual, and a marketing page that publishes them has made a commitment
 * nobody signed. What the page can say is what is negotiable, and who to ask.
 */
import type { Availability } from '../../lib/ai/availability'

export interface EnterpriseCapability {
  key: string
  title: string
  description: string
}

export const enterpriseInferenceCapabilities: EnterpriseCapability[] = [
  {
    key: 'shared',
    title: 'Shared inference',
    description:
      'The same routed service the API offers, with organization-level limits, attribution and invoicing on top.',
  },
  {
    key: 'managed',
    title: 'Managed deployments',
    description:
      'Selected models served on infrastructure Oxy operates, so the serving path is a known quantity rather than a routing decision.',
  },
  {
    key: 'dedicated',
    title: 'Private endpoints',
    description:
      'An endpoint scoped to one organization, not shared with other tenants.',
  },
  {
    key: 'reserved',
    title: 'Reserved capacity',
    description:
      'Capacity committed ahead of time for workloads that cannot absorb a queue, priced as capacity rather than as usage.',
  },
  {
    key: 'policy',
    title: 'Model, provider and region policy',
    description:
      'Allowlists, denylists and region constraints applied per application, enforced by the router rather than documented as guidance.',
  },
  {
    key: 'byok',
    title: 'Bring your own key',
    description:
      'Keep an existing provider contract and route it through the same API, attribution and limits.',
  },
  {
    key: 'invoicing',
    title: 'Invoicing and volume agreements',
    description:
      'Invoiced billing and negotiated volume terms, agreed per organization in the Oxy control plane.',
  },
  {
    key: 'permissions',
    title: 'Account, team and application permissions',
    description:
      'Who can create applications, issue credentials, change routing and see usage — decided per account, in Oxy Console.',
  },
  {
    key: 'audit',
    title: 'Auditability and usage reporting',
    description:
      'Usage attributed per application and credential, exportable for the people who have to reconcile it.',
  },
  {
    key: 'onboarding',
    title: 'Technical onboarding and evaluation',
    description:
      'A scoped evaluation with the models, regions and constraints you actually need, before a commitment exists.',
  },
]

/**
 * Deliberately explicit about what is NOT published.
 *
 * A visitor who came looking for a certification badge should leave knowing why
 * there is not one, rather than assuming the page forgot.
 */
export const enterpriseUndefinedTerms = {
  heading: 'What we are not publishing yet',
  body:
    'Support levels, service-level agreements and compliance certifications are agreed per contract. We are not publishing platform-wide figures for them, because a number on this page would be a commitment nobody signed. Ask, and you will get the current, scoped answer with the evidence behind it.',
}

export interface EnterpriseService {
  key: string
  name: string
  description: string
  availability: Availability
  href: string
  external?: boolean
}

/**
 * The `/enterprise` hub's service cards.
 *
 * `/company/business` is a different page about a different question — how Oxy
 * itself makes money. This one is what Oxy sells to organizations, and the hub
 * says so out loud so the two do not get merged again.
 */
export const enterpriseServices: EnterpriseService[] = [
  {
    key: 'ai',
    name: 'AI and inference',
    description:
      'Shared, managed and dedicated inference, with policy controls, attribution and invoicing per organization.',
    availability: 'private_preview',
    href: '/ai/enterprise',
  },
  {
    key: 'oxy-id',
    name: 'Oxy ID',
    description:
      'The identity layer every Oxy app signs in with, available to applications outside Oxy through the same platform.',
    availability: 'available',
    href: '/commons',
  },
  {
    key: 'platform',
    name: 'Platform and SDKs',
    description:
      'The documented REST API and the TypeScript, React and React Native SDKs the Oxy products themselves are built on.',
    availability: 'available',
    href: '/developers',
  },
  {
    key: 'peable',
    name: 'Oxy Pay',
    description:
      'Payments across the Oxy ecosystem. In development — nothing is open for deposits yet, and this card will say so until that changes.',
    availability: 'coming_soon',
    href: '/peable',
  },
]

export const enterpriseHubIntro = {
  heading: 'Oxy for organizations',
  body:
    'What Oxy sells to companies, and the state each of it is genuinely in. If you are looking for how Oxy itself makes money and where that money goes, that is a different page.',
  businessLinkLabel: 'How our business works',
  businessLinkHref: '/company/business',
}
