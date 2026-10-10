import { describe, expect, test } from 'bun:test';
import { getOnePlans, onePlanQuote } from '../src/data/pricing';

describe('Oxy One approved bundle pricing', () => {
  test('Personal includes Max; Family has a fixed shared allowance, regardless of member count', () => {
    expect(getOnePlans('personal').map((p) => p.name)).toEqual([
      'Free',
      'Go',
      'Pro',
      'Max',
      'Ultra',
    ]);
    const pro = getOnePlans('personal', 'family').find((p) => p.name === 'Pro')!;
    expect(onePlanQuote(pro, 'monthly', 1)).toMatchObject({
      totalMonthly: 4900,
      monthlyCredits: 20000,
      storageGB: 200,
    });
    expect(onePlanQuote(pro, 'monthly', 6)).toMatchObject({
      totalMonthly: 4900,
      monthlyCredits: 20000,
      storageGB: 200,
    });
    expect(onePlanQuote(pro, 'annual', undefined)).toMatchObject({
      totalMonthly: 3920,
      totalAnnual: 47040,
      monthlyCredits: 20000,
      storageGB: 200,
    });
  });
  test('Business bills the base plus seats and grants a monthly base plus per-seat credits', () => {
    const pro = getOnePlans('business').find((p) => p.name === 'Pro')!;
    expect(onePlanQuote(pro, 'monthly', 3)).toMatchObject({
      totalMonthly: 15699,
      monthlyCredits: 40000,
      storageGB: 130,
    });
    expect(onePlanQuote(pro, 'annual', 3)).toMatchObject({
      totalMonthly: 12559,
      totalAnnual: 150710,
      monthlyCredits: 40000,
      storageGB: 130,
    });
    expect(onePlanQuote(pro, 'annual', undefined)).toMatchObject({
      totalMonthly: undefined,
      totalAnnual: undefined,
      monthlyCredits: undefined,
      storageGB: undefined,
    });
  });
  test('Annual payment never multiplies monthly credits by twelve', () => {
    for (const audience of ['personal', 'creator', 'business'] as const) {
      for (const mode of ['individual', 'family'] as const) {
        for (const plan of getOnePlans(audience, mode)) {
          expect(onePlanQuote(plan, 'annual', 5).storageGB).toBe(
            onePlanQuote(plan, 'monthly', 5).storageGB,
          );
          expect(onePlanQuote(plan, 'annual', 5).monthlyCredits).toBe(
            onePlanQuote(plan, 'monthly', 5).monthlyCredits,
          );
        }
      }
    }
  });
});
