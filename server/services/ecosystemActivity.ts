import { createEcosystemTraffic, type EcosystemTrafficOptions } from '@oxy.so/core/server'

type Activity = ReturnType<typeof createEcosystemTraffic>

/** Configure before listen, once per process; activates on credential presence, and an incomplete credential/region set fails at boot. */
export function startWebsiteActivity(
  ready: () => boolean,
  environment: NodeJS.ProcessEnv = process.env,
  create: (options: EcosystemTrafficOptions) => Activity = createEcosystemTraffic,
): Activity | undefined {
  if (!environment.OXY_SERVICE_API_KEY?.trim() || !environment.OXY_SERVICE_API_SECRET?.trim()) return undefined
  if (!environment.OXY_SERVICE_API_KEY || !environment.OXY_SERVICE_API_SECRET || !environment.AWS_REGION) {
    throw new Error('Enabled ecosystem activity requires service credentials and AWS_REGION')
  }
  const activity = create({ service: 'website', region: environment.AWS_REGION, baseURL: environment.OXY_API_BASE, ready })
  activity.installFetch()
  return activity
}
