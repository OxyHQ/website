import { createEcosystemTraffic, type EcosystemTrafficOptions } from '@oxy.so/core/server'

type Activity = ReturnType<typeof createEcosystemTraffic>

/** Configure before listen, once per process; missing enabled credentials fail at boot. */
export function startWebsiteActivity(
  ready: () => boolean,
  environment: NodeJS.ProcessEnv = process.env,
  create: (options: EcosystemTrafficOptions) => Activity = createEcosystemTraffic,
): Activity | undefined {
  const enabled = environment.OXY_ECOSYSTEM_ACTIVITY_ENABLED
  if (enabled !== undefined && enabled !== 'true' && enabled !== 'false') throw new Error('OXY_ECOSYSTEM_ACTIVITY_ENABLED must be true or false')
  if (enabled !== 'true') return undefined
  if (!environment.OXY_SERVICE_API_KEY || !environment.OXY_SERVICE_API_SECRET || !environment.AWS_REGION) {
    throw new Error('Enabled ecosystem activity requires service credentials and AWS_REGION')
  }
  const activity = create({ service: 'website', region: environment.AWS_REGION, baseURL: environment.OXY_API_BASE, ready })
  activity.installFetch()
  return activity
}
