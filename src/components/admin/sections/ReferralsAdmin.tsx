import { useState } from 'react'
import {
  useReferrals,
  useCreateReferral,
  useUpdateReferral,
  useDeleteReferral,
  type ReferralRecord,
  type ReferralType,
  type ReferralStatus,
} from '../../../api/hooks'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'

// Each row in the list view groups referrals by program type, so admins can
// scan affiliates vs. ambassadors vs. casual share codes at a glance.
const TYPE_LABELS: Record<ReferralType, string> = {
  paid: 'Paid affiliates',
  ambassador: 'Ambassadors',
  user: 'Just share',
}

const TYPE_DESCRIPTIONS: Record<ReferralType, string> = {
  paid: 'Commission-based partners — paid per signup or per conversion.',
  ambassador: 'Unpaid-but-tracked advocates. Perks and recognition only.',
  user: 'Casual share links for anyone who wants to pass on what they love.',
}

const TYPE_ORDER: ReferralType[] = ['paid', 'ambassador', 'user']

function emptyReferral(): ReferralRecord {
  return {
    code: '',
    name: '',
    email: '',
    type: 'user',
    status: 'active',
    oxyUserId: '',
    commissionPercent: 0,
    customLandingUrl: '',
    notes: '',
    clicks: 0,
    signups: 0,
  }
}

/** URL-safe slug, uppercased so "alex-2026" becomes "ALEX-2026". */
function slugifyCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ReferralsAdmin() {
  const { data, refetch } = useReferrals()
  const createMutation = useCreateReferral()
  const updateMutation = useUpdateReferral()
  const deleteMutation = useDeleteReferral()
  const [editing, setEditing] = useState<ReferralRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const referrals = data ?? []

  const save = async () => {
    if (!editing) return
    setError(null)
    setSaving(true)
    try {
      const payload: Partial<ReferralRecord> = {
        code: editing.code,
        name: editing.name,
        type: editing.type,
        status: editing.status,
      }
      if (editing.email) payload.email = editing.email
      if (editing.oxyUserId) payload.oxyUserId = editing.oxyUserId
      if (editing.customLandingUrl) payload.customLandingUrl = editing.customLandingUrl
      if (editing.notes) payload.notes = editing.notes
      if (editing.type === 'paid' && typeof editing.commissionPercent === 'number') {
        payload.commissionPercent = editing.commissionPercent
      }
      if (editing._id) {
        await updateMutation.mutateAsync({ code: editing.code, patch: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      await refetch()
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save referral')
    } finally {
      setSaving(false)
    }
  }

  const deleteAction = useConfirmAction<ReferralRecord>({
    onConfirm: async (referral) => {
      await deleteMutation.mutateAsync(referral.code)
      await refetch()
    },
  })

  if (editing) {
    const isNew = !editing._id
    const isPaid = editing.type === 'paid'
    return (
      <div>
        <div className="mb-4">
          <Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back to list</Button>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {isNew ? 'New referral' : `Edit: ${editing.name}`}
        </h2>

        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Referrer name</Label>
              <Input
                value={editing.name}
                onChange={(e) => {
                  const name = e.target.value
                  setEditing({
                    ...editing,
                    name,
                    ...(isNew && !editing.code ? { code: slugifyCode(name) } : {}),
                  })
                }}
                placeholder="Alex Rivera"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Code</Label>
              <Input
                value={editing.code}
                onChange={(e) => setEditing({ ...editing, code: slugifyCode(e.target.value) })}
                disabled={!isNew}
                className="font-mono"
                placeholder="ALEX-2026"
              />
              {!isNew && <p className="text-xs text-muted-foreground">Code cannot be changed after creation.</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Contact email (admin-only)</Label>
            <Input
              type="email"
              value={editing.email ?? ''}
              onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              placeholder="alex@example.com"
            />
            <p className="text-xs text-muted-foreground">Never exposed on the public /referrals endpoint — admin tracking only.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Program type</Label>
              <select
                value={editing.type}
                onChange={(e) => setEditing({ ...editing, type: e.target.value as ReferralType })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="user">Just share (casual user)</option>
                <option value="ambassador">Ambassador (unpaid, tracked)</option>
                <option value="paid">Paid affiliate (commission)</option>
              </select>
              <p className="text-xs text-muted-foreground">{TYPE_DESCRIPTIONS[editing.type]}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as ReferralStatus })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="revoked">Revoked</option>
              </select>
              <p className="text-xs text-muted-foreground">Only active codes resolve on the public endpoint.</p>
            </div>
          </div>

          {isPaid && (
            <div className="rounded-xl border border-border p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Commission</div>
              <div className="mt-3 flex flex-col gap-1.5">
                <Label>Commission percent</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={editing.commissionPercent ?? 0}
                    onChange={(e) => setEditing({ ...editing, commissionPercent: Number(e.target.value) })}
                    className="w-32"
                  />
                  <span className="text-sm text-muted-foreground">% of plan value per signup</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Custom landing URL (optional)</Label>
            <Input
              value={editing.customLandingUrl ?? ''}
              onChange={(e) => setEditing({ ...editing, customLandingUrl: e.target.value })}
              placeholder="/pricing"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Where the code sends visitors. Defaults to /referrals?ref=CODE.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Linked Oxy user id (optional)</Label>
            <Input
              value={editing.oxyUserId ?? ''}
              onChange={(e) => setEditing({ ...editing, oxyUserId: e.target.value })}
              className="font-mono"
              placeholder="64f1e2…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Admin notes</Label>
            <Textarea
              value={editing.notes ?? ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              rows={3}
              placeholder="Deal terms, attribution window, payout cadence…"
            />
            <p className="text-xs text-muted-foreground">Never exposed publicly.</p>
          </div>

          {!isNew && (
            <div className="rounded-xl border border-border p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stats</div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-semibold text-foreground">{editing.clicks}</div>
                  <div className="text-xs text-muted-foreground">Clicks</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">{editing.signups}</div>
                  <div className="text-xs text-muted-foreground">Signups</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Clicks are auto-tracked. Signups are updated manually for now — no automated payout flow yet.</p>
            </div>
          )}

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex items-center gap-2">
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </PrimaryButton>
            <SecondaryButton onPress={() => setEditing(null)}>Cancel</SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Referrals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Track every referral code across paid affiliates, ambassadors, and casual user shares.
          </p>
        </div>
        <PrimaryButton onPress={() => setEditing(emptyReferral())}>Add referral</PrimaryButton>
      </div>

      {TYPE_ORDER.map((type) => {
        const items = referrals.filter((r) => r.type === type)
        return (
          <section key={type} className="mt-8">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {TYPE_LABELS[type]}
              </h3>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{TYPE_DESCRIPTIONS[type]}</p>
            {items.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No {TYPE_LABELS[type].toLowerCase()} yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
                {items.map((referral) => (
                  <div key={referral.code} className="flex items-center gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{referral.name}</span>
                        {referral.status !== 'active' && (
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {referral.status}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        <span className="font-mono">{referral.code}</span>
                        {referral.type === 'paid' && typeof referral.commissionPercent === 'number' && (
                          <> · {referral.commissionPercent}% commission</>
                        )}
                        {referral.customLandingUrl && <> · → {referral.customLandingUrl}</>}
                      </div>
                    </div>
                    <div className="hidden shrink-0 text-right text-xs text-muted-foreground md:block">
                      <div><span className="text-foreground">{referral.clicks}</span> clicks</div>
                      <div><span className="text-foreground">{referral.signups}</span> signups</div>
                    </div>
                    <div className="shrink-0">
                      <Button variant="ghost" size="small" onPress={() => setEditing({ ...referral })}>Edit</Button>
                      <Button variant="ghost" size="small" onPress={() => deleteAction.request(referral)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target ? `Delete referral “${deleteAction.target.code}”?` : 'Delete referral?'}
        description="This permanently removes the referral code. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={deleteAction.busy}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}
