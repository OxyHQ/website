import { canAttestWorkloadIdentity, createEcosystemTraffic, type EcosystemTrafficOptions } from '@oxy.so/core/server'

type Activity = ReturnType<typeof createEcosystemTraffic>

/**
 * Whether this process can act as the Oxy application `website` AT ALL.
 *
 * The question the key check was always asking, and the reason it had to stop
 * asking it by name. Under oxy ADR 0026 a first-party service proves what it IS:
 * on ECS the task role attests and there is no secret anywhere, and
 * `createEcosystemTraffic` mints from whichever of the two it finds. A deployed
 * website-api therefore carries neither variable.
 *
 * Read this rather than the pair, because the pair's absence stopped being
 * evidence of anything. On the deploy that drops the two variables a key check
 * would return below on a task whose identity is its ROLE, and what that looks
 * like from outside is the website reporting zero traffic to the dashboard —
 * indistinguishable from a quiet day, with nothing anywhere saying the publisher
 * was never started.
 *
 * A checkout that can neither attest nor present a pair is still the honest
 * "the website cannot act as itself here", and the two names are still the thing
 * to set THERE.
 */
function canAuthenticateAsOxyService(environment: NodeJS.ProcessEnv): boolean {
  return (
    canAttestWorkloadIdentity() ||
    Boolean(environment.OXY_SERVICE_API_KEY?.trim() && environment.OXY_SERVICE_API_SECRET?.trim())
  )
}

/** Configure before listen, once per process; activates on any usable identity, and a missing region still fails at boot. */
export function startWebsiteActivity(
  ready: () => boolean,
  environment: NodeJS.ProcessEnv = process.env,
  create: (options: EcosystemTrafficOptions) => Activity = createEcosystemTraffic,
): Activity | undefined {
  if (!canAuthenticateAsOxyService(environment)) return undefined
  /**
   * Still a throw, and now it is only about the region.
   *
   * It used to carry two jobs: refuse a HALF credential (a key with no secret,
   * which is a typo, not a configuration), and refuse a missing region. The
   * first job moved into the check above — a half pair is not a usable identity,
   * so it returns rather than throws, exactly as an empty environment does. What
   * is left is the one an attesting task can still get wrong.
   */
  if (!environment.AWS_REGION) {
    throw new Error('Enabled ecosystem activity requires AWS_REGION')
  }
  const activity = create({ service: 'website', region: environment.AWS_REGION, baseURL: environment.OXY_API_BASE, ready })
  activity.installFetch()
  return activity
}
