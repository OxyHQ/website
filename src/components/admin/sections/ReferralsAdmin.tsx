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
import { Button, PrimaryButton, SecondaryButton } from '@oxy.so/bloom/button'
import { LabeledTextField } from '../LabeledTextField'
import { Textarea } from '@oxy.so/bloom/textarea'
import { Label } from '@oxy.so/bloom/label'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'
import OptionSelect from '../../ui/OptionSelect'

// Each row in the list view groups referrals by program type, so admins can
// scan affiliates vs. ambassadors vs. casual share codes at a glance.
const TYPE_LABELS: Record<ReferralType, string> = {
  paid: 'Paid affiliates',
  ambassador: 'Ambassadors',
  user: 'Just share',
}

const TYPE_DESCRIPTIONS: Record<ReferralType, string> = {
  paid: 'Commission-based partners, paid per signup or per conversion.',
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
              <LabeledTextField
                label="Referrer name"
                value={editing.name}
                onValueChange={(name) => {
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
              <LabeledTextField
                label="Code"
                value={editing.code}
                onValueChange={(v) => setEditing({ ...editing, code: slugifyCode(v) })}
                disabled={!isNew}
                style={{ fontFamily: 'var(--font-mono)' }}
                placeholder="ALEX-2026"
              />
              {!isNew && <p className="text-xs text-muted-foreground">Code cannot be changed after creation.</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <LabeledTextField
              label="Contact email (admin-only)"
              autoComplete="email"
              inputMode="email"
              value={editing.email ?? ''}
              onValueChange={(v) => setEditing({ ...editing, email: v })}
              placeholder="alex@example.com"
            />
            <p className="text-xs text-muted-foreground">Never exposed on the public /referrals endpoint. Admin tracking only.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Program type</Label>
              <OptionSelect
                label="Program type"
                value={editing.type}
                onValueChange={(value) => setEditing({ ...editing, type: value as ReferralType })}
                options={[
                  { value: 'user', label: 'Just share (casual user)' },
                  { value: 'ambassador', label: 'Ambassador (unpaid, tracked)' },
                  { value: 'paid', label: 'Paid affiliate (commission)' },
                ]}
              />
              <p className="text-xs text-muted-foreground">{TYPE_DESCRIPTIONS[editing.type]}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <OptionSelect
                label="Status"
                value={editing.status}
                onValueChange={(value) => setEditing({ ...editing, status: value as ReferralStatus })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'paused', label: 'Paused' },
                  { value: 'revoked', label: 'Revoked' },
                ]}
              />
              <p className="text-xs text-muted-foreground">Only active codes resolve on the public endpoint.</p>
            </div>
          </div>

          {isPaid && (
            <div className="rounded-xl border border-border p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Commission</div>
              <div className="mt-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <LabeledTextField
                    label="Commission percent"
                    inputMode="decimal"
                    value={String(editing.commissionPercent ?? 0)}
                    onValueChange={(v) => setEditing({ ...editing, commissionPercent: Number(v) })}
                    style={{ width: 128 }}
                  />
                  <span className="text-sm text-muted-foreground">% of plan value per signup</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <LabeledTextField
              label="Custom landing URL (optional)"
              value={editing.customLandingUrl ?? ''}
              onValueChange={(v) => setEditing({ ...editing, customLandingUrl: v })}
              placeholder="/pricing"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <p className="text-xs text-muted-foreground">Where the code sends visitors. Defaults to /referrals?ref=CODE.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <LabeledTextField
              label="Linked Oxy user id (optional)"
              value={editing.oxyUserId ?? ''}
              onValueChange={(v) => setEditing({ ...editing, oxyUserId: v })}
              style={{ fontFamily: 'var(--font-mono)' }}
              placeholder="64f1e2…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Textarea
              label="Admin notes"
              value={editing.notes ?? ''}
              onValueChange={(v) => setEditing({ ...editing, notes: v })}
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
              <p className="mt-3 text-xs text-muted-foreground">Clicks are auto-tracked. Signups are updated manually for now. No automated payout flow yet.</p>
            </div>
          )}

          {error && <p className="text-sm text-error-text">{error}</p>}

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
                          <span className="rounded-full border border-border px-2 py-0.5 text-label-sm uppercase tracking-wider text-muted-foreground">
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
        error={deleteAction.error}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}
