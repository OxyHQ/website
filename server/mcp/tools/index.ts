import type { ToolRegistrar } from '../registry.js'
import { registerAcademyTools } from './academy.js'
import { registerChangelogTools } from './changelog.js'
import { registerDiscoveryTools } from './discovery.js'
import { registerLocaleTools } from './locales.js'
import { registerMediaTools } from './media.js'
import { registerNewsroomTools } from './newsroom.js'
import { registerPricingTools } from './pricing.js'
import { registerProductTools } from './products.js'
import { registerReferralTools } from './referrals.js'
import { registerSiteTools } from './site.js'
import { registerTeamTools } from './team.js'

/** Every domain, in the order `describe_access` lists them. */
export const TOOL_DOMAINS: readonly [string, (server: ToolRegistrar) => void][] = [
  ['discovery', registerDiscoveryTools],
  ['site', registerSiteTools],
  ['newsroom', registerNewsroomTools],
  ['academy-and-help', registerAcademyTools],
  ['team', registerTeamTools],
  ['products', registerProductTools],
  ['pricing', registerPricingTools],
  ['changelog', registerChangelogTools],
  ['media', registerMediaTools],
  ['localization', registerLocaleTools],
  ['referrals', registerReferralTools],
]
