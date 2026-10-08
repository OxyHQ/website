import { describe, expect, test } from 'bun:test'
import { organizationSeatCount, pricingOrganizationId } from '../src/lib/pricingSeats'

describe('Business organization seats', () => {
  const organizations = [
    { accountId: 'person', kind: 'personal' as const },
    { accountId: 'org-a', kind: 'organization' as const },
    { accountId: 'org-b', kind: 'organization' as const },
    { accountId: 'project', kind: 'project' as const },
  ]
  test('uses the active organization without mixing its membership with another', () => {
    expect(pricingOrganizationId('org-b', organizations)).toBe('org-b')
    expect(pricingOrganizationId('org-a', organizations)).toBe('org-a')
  })
  test('resolves a single linked organization, but never guesses among multiple', () => {
    expect(pricingOrganizationId('person', organizations.slice(0, 2))).toBe('org-a')
    expect(pricingOrganizationId('person', organizations)).toBeUndefined()
    expect(pricingOrganizationId('person', [])).toBeUndefined()
    expect(pricingOrganizationId('person', [organizations[0], organizations[3]])).toBeUndefined()
  })
  test('counts active people once, including inherited memberships, excluding invitations and removed members', () => {
    expect(organizationSeatCount([
      { memberUserId: 'owner', status: 'active' },
      { memberUserId: 'editor', status: 'active' },
      { memberUserId: 'editor', status: 'active' },
      { memberUserId: 'pending', status: 'invited' },
      { memberUserId: 'former', status: 'removed' },
    ])).toBe(2)
    expect(organizationSeatCount([])).toBe(0)
  })
})
