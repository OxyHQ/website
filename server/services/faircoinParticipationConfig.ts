import { z } from 'zod';

const enabledConfig = z.object({
  reviewer: z.string().trim().min(1).max(160),
  retentionDays: z.coerce.number().int().min(1).max(365),
  privacyContact: z.string().trim().toLowerCase().email().max(254),
});

/** Explicit activation, independent of landing publication and pilot status. */
export function readFaircoinParticipationConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const flag = environment.FAIRCOIN_APPLICATIONS_ENABLED?.trim() || 'false';
  if (flag !== 'true' && flag !== 'false') {
    throw new Error('FAIRCOIN_APPLICATIONS_ENABLED must be true or false');
  }
  if (flag === 'false') return { enabled: false as const };
  const result = enabledConfig.safeParse({
    reviewer: environment.FAIRCOIN_APPLICATION_REVIEWER,
    retentionDays: environment.FAIRCOIN_APPLICATION_RETENTION_DAYS,
    privacyContact: environment.FAIRCOIN_APPLICATION_PRIVACY_CONTACT,
  });
  if (!result.success) {
    // Configuration values may identify the reviewer. Do not include them.
    throw new Error(
      'FairCoin applications require an assigned reviewer, retention of 1–365 days and a privacy contact email',
    );
  }
  return { enabled: true as const, ...result.data };
}
