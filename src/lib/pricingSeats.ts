import type { AccountMember, AccountNode } from '@oxy.so/core';

type OrganizationAccount = Pick<AccountNode, 'accountId' | 'kind'>;
type SeatMember = Pick<AccountMember, 'memberUserId' | 'status'>;

/** Never choose an arbitrary organization when a person belongs to several. */
export function pricingOrganizationId(activeId: string, accounts: OrganizationAccount[]) {
  const organizations = accounts.filter((account) => account.kind === 'organization');
  return (
    organizations.find((account) => account.accountId === activeId)?.accountId ??
    (organizations.length === 1 ? organizations[0].accountId : undefined)
  );
}

/** The roster includes inherited memberships; count each active person once. */
export function organizationSeatCount(members: SeatMember[]) {
  return new Set(
    members.filter((member) => member.status === 'active').map((member) => member.memberUserId),
  ).size;
}
