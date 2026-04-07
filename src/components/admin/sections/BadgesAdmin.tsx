import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../api/client'
import { BADGE_DEFINITIONS } from '../../../data/badges'
import { Button, PrimaryButton } from '@oxyhq/bloom/button'
import { Input } from '../../ui/shadcn/input'

export default function BadgesAdmin() {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [selectedBadge, setSelectedBadge] = useState('')
  const [searchUser, setSearchUser] = useState('')

  // Search awarded badges by username
  const { data: userBadges } = useQuery({
    queryKey: ['admin-badges', searchUser],
    queryFn: () => apiFetch<Array<{ badgeId: string; awardedAt: string }>>(`/profiles/${searchUser}/badges`),
    enabled: searchUser.length > 0,
  })

  const awardBadge = useMutation({
    mutationFn: (params: { userId: string; username: string; badgeId: string }) =>
      apiFetch('/badges/award', { method: 'POST', body: JSON.stringify(params) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] })
      setUsername('')
      setSelectedBadge('')
    },
  })

  const revokeBadge = useMutation({
    mutationFn: ({ userId, badgeId }: { userId: string; badgeId: string }) =>
      apiFetch(`/badges/${userId}/${badgeId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] })
    },
  })

  const badgeIds = Object.keys(BADGE_DEFINITIONS)

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Badges</h2>
      <p className="mt-1 text-sm text-muted-foreground">Award and manage user badges</p>

      {/* Badge catalog */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-foreground">Badge Catalog</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {badgeIds.map(id => {
            const badge = BADGE_DEFINITIONS[id]
            return (
              <div key={id} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: badge.color }}
                  >
                    {badge.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{badge.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">{badge.rarity}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{badge.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Award badge */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-foreground">Award Badge</h3>
        <div className="mt-3 flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Username</label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Badge</label>
            <select
              value={selectedBadge}
              onChange={e => setSelectedBadge(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Select badge</option>
              {badgeIds.map(id => (
                <option key={id} value={id}>{BADGE_DEFINITIONS[id].name}</option>
              ))}
            </select>
          </div>
          <PrimaryButton
            onPress={() => {
              if (username && selectedBadge) {
                awardBadge.mutate({ userId: username, username, badgeId: selectedBadge })
              }
            }}
            disabled={!username || !selectedBadge || awardBadge.isPending}
          >
            {awardBadge.isPending ? 'Awarding...' : 'Award'}
          </PrimaryButton>
        </div>
      </div>

      {/* Lookup user badges */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-foreground">Lookup User Badges</h3>
        <div className="mt-3 flex items-center gap-3">
          <Input
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
            placeholder="Search by username"
            className="w-48"
          />
        </div>

        {searchUser && userBadges && (
          <div className="mt-4 flex flex-col gap-2">
            {userBadges.length === 0 && (
              <p className="text-sm text-muted-foreground">No badges for @{searchUser}</p>
            )}
            {userBadges.map(b => {
              const def = BADGE_DEFINITIONS[b.badgeId]
              return (
                <div key={b.badgeId} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: def?.color ?? '#666' }}
                    >
                      {def?.name.charAt(0) ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{def?.name ?? b.badgeId}</p>
                      <p className="text-xs text-muted-foreground">
                        Awarded {new Date(b.awardedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="small"
                    onPress={() => revokeBadge.mutate({ userId: searchUser, badgeId: b.badgeId })}
                  >
                    Revoke
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
