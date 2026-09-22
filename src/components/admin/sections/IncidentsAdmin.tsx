import { useState } from 'react'
import {
  useIncidentsAdmin,
  useProducts,
  type IncidentHistoryEntry,
  type IncidentSeverity,
  type IncidentUpdateStatus,
} from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxy.so/bloom/button'
import { LabeledTextField } from '../LabeledTextField'
import { Textarea } from '@oxy.so/bloom/textarea'
import { Label } from '../../ui/shadcn/label'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'

const SEVERITIES: IncidentSeverity[] = ['minor', 'major', 'critical']
const UPDATE_STATUSES: IncidentUpdateStatus[] = ['investigating', 'identified', 'monitoring', 'resolved']

interface EditingIncident {
  _id?: string
  title: string
  severity: IncidentSeverity
  products: string[]
}

function emptyIncident(): EditingIncident {
  return { title: '', severity: 'minor', products: [] }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

export default function IncidentsAdmin() {
  const [page, setPage] = useState(1)
  const { data, refetch } = useIncidentsAdmin(page)
  const { data: productsData } = useProducts()
  const products = productsData ?? []

  const [editing, setEditing] = useState<EditingIncident | null>(null)
  const [history, setHistory] = useState<IncidentHistoryEntry['updates']>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newUpdateStatus, setNewUpdateStatus] = useState<IncidentUpdateStatus>('investigating')
  const [newUpdateBody, setNewUpdateBody] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)

  const openForEdit = (incident: IncidentHistoryEntry) => {
    setEditing({ _id: incident._id, title: incident.title, severity: incident.severity, products: incident.products })
    setHistory(incident.updates)
    setNewUpdateStatus(incident.status === 'resolved' ? 'investigating' : incident.status)
    setNewUpdateBody('')
    setError(null)
  }

  const openForCreate = () => {
    setEditing(emptyIncident())
    setHistory([])
    setNewUpdateStatus('investigating')
    setNewUpdateBody('')
    setError(null)
  }

  const save = async () => {
    if (!editing) return
    setError(null)
    setSaving(true)
    try {
      if (editing._id) {
        await apiFetch(`/status/incidents/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify({ title: editing.title, severity: editing.severity, products: editing.products }),
        })
      } else {
        if (!newUpdateBody.trim()) throw new Error('The first update needs a message.')
        await apiFetch('/status/incidents', {
          method: 'POST',
          body: JSON.stringify({
            title: editing.title,
            severity: editing.severity,
            products: editing.products,
            update: { status: newUpdateStatus, body: newUpdateBody },
          }),
        })
      }
      await refetch()
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save incident')
    } finally {
      setSaving(false)
    }
  }

  const postUpdate = async () => {
    if (!editing?._id || !newUpdateBody.trim()) return
    setPostingUpdate(true)
    setError(null)
    try {
      await apiFetch(`/status/incidents/${editing._id}/updates`, {
        method: 'POST',
        body: JSON.stringify({ status: newUpdateStatus, body: newUpdateBody }),
      })
      const fresh = await refetch()
      const updated = fresh.data?.incidents.find((i) => i._id === editing._id)
      if (updated) setHistory(updated.updates)
      setNewUpdateBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post update')
    } finally {
      setPostingUpdate(false)
    }
  }

  const deleteAction = useConfirmAction<IncidentHistoryEntry>({
    onConfirm: async (incident) => {
      await apiFetch(`/status/incidents/${incident._id}`, { method: 'DELETE' })
      await refetch()
    },
  })

  const toggleProduct = (id: string) => {
    if (!editing) return
    const next = editing.products.includes(id)
      ? editing.products.filter((p) => p !== id)
      : [...editing.products, id]
    setEditing({ ...editing, products: next })
  }

  if (editing) {
    const isNew = !editing._id
    return (
      <div>
        <div className="mb-4">
          <Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back to list</Button>
        </div>
        <h2 className="text-xl font-semibold text-foreground">{isNew ? 'New incident' : `Edit: ${editing.title}`}</h2>

        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <LabeledTextField
              label="Title"
              value={editing.title}
              onValueChange={(v) => setEditing({ ...editing, title: v })}
              placeholder="Elevated API latency"
            />
            <div className="flex flex-col gap-1.5">
              <Label>Severity</Label>
              <select
                value={editing.severity}
                onChange={(e) => setEditing({ ...editing, severity: e.target.value as IncidentSeverity })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Affected services</div>
            <p className="mt-1 text-xs text-muted-foreground">Leave all unchecked for a site-wide notice.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {products.map((product) => (
                <label key={product._id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product._id ? editing.products.includes(product._id) : false}
                    onChange={() => product._id && toggleProduct(product._id)}
                    className="size-4 rounded border border-border"
                  />
                  <span className="text-sm">{product.name}</span>
                </label>
              ))}
            </div>
          </div>

          {!isNew && (
            <div className="rounded-xl border border-border p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</div>
              <div className="mt-3 flex flex-col gap-3">
                {[...history].reverse().map((update) => (
                  <div key={update._id} className="rounded-lg bg-surface/50 p-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium capitalize text-foreground">{update.status}</span>
                      <span>{formatDateTime(update.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{update.body}</p>
                  </div>
                ))}
                {history.length === 0 && <p className="text-sm text-muted-foreground">No updates yet.</p>}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isNew ? 'First update' : 'Post an update'}
            </div>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <select
                  value={newUpdateStatus}
                  onChange={(e) => setNewUpdateStatus(e.target.value as IncidentUpdateStatus)}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  {UPDATE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Textarea
                label="Message (markdown)"
                value={newUpdateBody}
                onValueChange={setNewUpdateBody}
                rows={3}
              />
              {!isNew && (
                <div>
                  <SecondaryButton onPress={postUpdate} disabled={postingUpdate || !newUpdateBody.trim()}>
                    {postingUpdate ? 'Posting…' : 'Post update'}
                  </SecondaryButton>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-error-text">{error}</p>}

          <div className="flex items-center gap-2">
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Create incident' : 'Save changes'}
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
          <h2 className="text-xl font-semibold text-foreground">Incidents</h2>
          <p className="mt-1 text-sm text-muted-foreground">Powers the /status page banner and the /history timeline.</p>
        </div>
        <PrimaryButton onPress={openForCreate}>New incident</PrimaryButton>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="small" onPress={() => setPage((p) => p + 1)}>&larr; Older</Button>
        <span className="text-sm font-medium text-foreground">{data?.label ?? '…'}</span>
        <Button variant="ghost" size="small" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))}>Newer &rarr;</Button>
      </div>

      {data && data.incidents.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No incidents this month.</p>
      ) : (
        <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
          {(data?.incidents ?? []).map((incident) => (
            <div key={incident._id} className="flex items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{incident.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  <span className="capitalize">{incident.severity}</span> · <span className="capitalize">{incident.status}</span> ·{' '}
                  {incident.affectedServices.length > 0 ? incident.affectedServices.map((s) => s.name).join(', ') : 'Site-wide'} ·{' '}
                  {formatDateTime(incident.startedAt)}
                </div>
              </div>
              <div className="shrink-0">
                <Button variant="ghost" size="small" onPress={() => openForEdit(incident)}>Edit</Button>
                <Button variant="ghost" size="small" onPress={() => deleteAction.request(incident)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target ? `Delete “${deleteAction.target.title}”?` : 'Delete incident?'}
        description="This permanently removes the incident and its update history. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={deleteAction.busy}
        error={deleteAction.error}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}
