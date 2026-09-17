import type { ToolRegistrar } from '../registry.js'
import { registerAcademyTools } from './academy.js'
import { registerCareersTools } from './careers.js'
import { registerChangelogTools } from './changelog.js'
import { registerDiscoveryTools } from './discovery.js'
import { registerLocaleTools } from './locales.js'
import { registerMediaTools } from './media.js'
import { registerNewsroomTools } from './newsroom.js'
import { registerPricingTools } from './pricing.js'
import { registerProductTools } from './products.js'
import { registerReferralTools } from './referrals.js'
import { registerSiteTools } from './site.js'

/** Every domain, in the order `describe_access` lists them. */
export const TOOL_DOMAINS: readonly [string, (server: ToolRegistrar) => void][] = [
  ['discovery', registerDiscoveryTools],
  ['site', registerSiteTools],
  ['newsroom', registerNewsroomTools],
  ['academy-and-help', registerAcademyTools],
  ['careers', registerCareersTools],
  ['products', registerProductTools],
  ['pricing', registerPricingTools],
  ['changelog', registerChangelogTools],
  ['media', registerMediaTools],
  ['localization', registerLocaleTools],
  ['referrals', registerReferralTools],
]
