/* ─────────────────────────────────────────────
   Developers page — static content constants.
   The SDK list is built at render time from the
   synced docs index, not hardcoded here.
   ───────────────────────────────────────────── */

import type { DocsCategory } from '../../scripts/types'

/* ── Hero ── */

export const heroEyebrow = 'Developers'
export const heroTitle = 'Build on Oxy.'
export const heroDescription =
  'TypeScript SDKs, React hooks, React Native components, and a fully documented REST API — everything open source, no vendor lock-in.'
export const heroPrimaryCta = { label: 'Read the docs', href: '/developers/docs' }
export const heroSecondaryCta = { label: 'Browse the API', href: '/developers/docs/api' }

/* ── SDK category labels (drives the SDKs section grouping) ── */

export interface CategoryConfig {
  category: DocsCategory
  title: string
  description: string
}

export const sdkCategories: CategoryConfig[] = [
  {
    category: 'sdk',
    title: 'SDKs',
    description: 'TypeScript clients, React hooks, and React Native components.',
  },
  {
    category: 'ui-library',
    title: 'UI Library',
    description: 'Cross-platform components and theming primitives.',
  },
  {
    category: 'service',
    title: 'Services',
    description: 'Backend services and REST APIs you can call from anywhere.',
  },
  {
    category: 'app',
    title: 'Apps',
    description: 'Reference implementations powering the Oxy product surface.',
  },
]

export const sdksHeading = 'Pick your stack'
export const sdksDescription =
  'Every Oxy package ships with full TypeScript types, generated API references, and is open source on GitHub.'

/* ── Quick start ── */

export const quickStartEyebrow = 'Quick start'
export const quickStartHeading = 'Up and running in 60 seconds'
export const quickStartDescription =
  'Install the React Native SDK and wrap your app — that is the whole setup.'

export const quickStartInstall = 'bun add @oxyhq/services @oxyhq/core'

export const quickStartUsage = `import { OxyProvider, useOxy } from '@oxyhq/services'

export default function App() {
  return (
    <OxyProvider baseURL="https://api.oxy.so">
      <SignInButton />
    </OxyProvider>
  )
}

function SignInButton() {
  const { isAuthenticated, signIn, user } = useOxy()
  if (isAuthenticated) return <Text>Hello, {user?.username}</Text>
  return <Button onPress={signIn} title="Sign in with Oxy" />
}`

/* ── REST API promo ── */

export const apiEyebrow = 'REST API'
export const apiHeading = 'One API for the whole platform'
export const apiDescription =
  'Auth, accounts, files, billing, federation — all behind a single, fully documented OpenAPI surface. Use the SDKs, or call it directly from any language.'
export const apiCta = { label: 'Open the API reference', href: '/developers/docs/api' }

/* ── Resources ── */

export interface ResourceCard {
  title: string
  description: string
  href: string
  external?: boolean
}

export const resourcesHeading = 'Keep building'
export const resources: ResourceCard[] = [
  {
    title: 'Changelog',
    description: 'New releases, breaking changes, and migration notes.',
    href: '/changelog',
  },
  {
    title: 'Status',
    description: 'Live availability for the platform and APIs.',
    href: '/status',
  },
  {
    title: 'Help center',
    description: 'Guides, FAQs, and troubleshooting for builders.',
    href: '/help',
  },
  {
    title: 'GitHub',
    description: 'Source code, issues, and community contributions.',
    href: 'https://github.com/OxyHQ',
    external: true,
  },
]

/* ── Final CTA ── */

export const ctaHeading = 'Ready to build?'
export const ctaDescription =
  'Start with the docs, or jump straight into the API reference.'
