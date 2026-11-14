import { expect, test } from 'bun:test';
import { readFaircoinParticipationConfig } from './faircoinParticipationConfig.js';

test('intake stays closed unless explicitly enabled with review and privacy ownership', () => {
  expect(readFaircoinParticipationConfig({})).toEqual({ enabled: false });
  expect(() => readFaircoinParticipationConfig({ FAIRCOIN_APPLICATIONS_ENABLED: 'yes' })).toThrow();
  expect(() =>
    readFaircoinParticipationConfig({ FAIRCOIN_APPLICATIONS_ENABLED: 'true' }),
  ).toThrow();
  const valid = {
    FAIRCOIN_APPLICATIONS_ENABLED: 'true',
    FAIRCOIN_APPLICATION_REVIEWER: 'Assigned reviewer',
    FAIRCOIN_APPLICATION_RETENTION_DAYS: '90',
    FAIRCOIN_APPLICATION_PRIVACY_CONTACT: 'privacy@example.test',
  };
  expect(readFaircoinParticipationConfig(valid)).toMatchObject({
    enabled: true,
    retentionDays: 90,
  });
  for (const value of ['0', '366', '90days', '1.5']) {
    expect(() =>
      readFaircoinParticipationConfig({ ...valid, FAIRCOIN_APPLICATION_RETENTION_DAYS: value }),
    ).toThrow();
  }
  for (const field of ['FAIRCOIN_APPLICATION_REVIEWER', 'FAIRCOIN_APPLICATION_PRIVACY_CONTACT']) {
    expect(() => readFaircoinParticipationConfig({ ...valid, [field]: '' })).toThrow();
  }
});
