import { createEcosystemTraffic, type EcosystemTrafficOptions } from '@oxy.so/core/server';
import { createAwsWorkloadCredentialProvider } from '@oxy.so/core/server/aws';

type Activity = ReturnType<typeof createEcosystemTraffic>;

/** Configure before listen; the shared provider resolves ECS or registered local IAM credentials lazily. */
export function startWebsiteActivity(
  ready: () => boolean,
  environment: Readonly<Record<string, string | undefined>> = process.env,
  create: (options: EcosystemTrafficOptions) => Activity = createEcosystemTraffic,
): Activity {
  const activity = create({
    service: 'website',
    region: environment.AWS_REGION,
    baseURL: environment.OXY_API_BASE,
    workloadCredentials: createAwsWorkloadCredentialProvider(),
    ready,
  });
  activity.installFetch();
  return activity;
}
