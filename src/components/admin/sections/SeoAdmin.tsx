import { useState } from 'react'
import { useAdminSeo, useUpsertSeo, useDeleteSeo, type SeoBrand, type SeoMeta, type SeoData } from '../../../api/hooks'
import { PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'

const BRANDS: { id: SeoBrand; label: string }[] = [
  { id: 'oxy', label: 'Oxy' },
  { id: 'faircoin', label: 'FairCoin' },
]

/** The brand default lives at `path: '*'`; everything else is a real route. */
const DEFAULT_PATH = '*'

const emptyMeta = (): SeoMeta => ({ title: '', description: '', ogImage: '' })

/** One per-route row, kept in local edit state until the admin saves it. */
interface RouteRow {
  /** The path persisted on the server. Empty for a freshly-added, unsaved row. */
  savedPath: string
  path: string
  title: string
  description: string
  ogImage: string
}

function rowsFromData(data: SeoData | undefined, brand: SeoBrand): RouteRow[] {
  const routes = data?.[brand]?.routes ?? {}
  return Object.entries(routes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, meta]) => ({ savedPath: path, path, title: meta.title, description: meta.description, ogImage: meta.ogImage }))
}

export default function SeoAdmin() {
  const { data } = useAdminSeo()
  const upsert = useUpsertSeo()
  const remove = useDeleteSeo()

  const [brand, setBrand] = useState<SeoBrand>('oxy')

  // Brand-default form (path `*`), seeded from the API and re-seeded when the
  // fetched data or the active brand changes (the render-phase sync pattern used
  // across the admin, avoiding a useEffect).
  const [defaultForm, setDefaultForm] = useState<SeoMeta>(emptyMeta)
  const [rows, setRows] = useState<RouteRow[]>([])
  const [syncedKey, setSyncedKey] = useState<string | null>(null)
  const syncKey = data ? `${brand}:${data[brand]?.default ? 'd' : ''}:${rowsFromData(data, brand).length}` : null

  const [savingDefault, setSavingDefault] = useState(false)
  const [savingPath, setSavingPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (data && syncKey !== syncedKey) {
    setSyncedKey(syncKey)
    setDefaultForm(data[brand]?.default ?? emptyMeta())
    setRows(rowsFromData(data, brand))
  }

  const switchBrand = (next: SeoBrand) => {
    if (next === brand) return
    setError(null)
    setBrand(next)
    setSyncedKey(null) // force a re-seed from `data` for the new brand on next render
  }

  const saveDefault = async () => {
    setError(null)
    setSavingDefault(true)
    try {
      await upsert.mutateAsync({ brand, path: DEFAULT_PATH, ...defaultForm })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand default')
    } finally {
      setSavingDefault(false)
    }
  }

  const updateRow = (idx: number, patch: Partial<RouteRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const addRow = () => {
    setRows((prev) => [...prev, { savedPath: '', path: '', title: '', description: '', ogImage: '' }])
  }

  const saveRow = async (idx: number) => {
    const row = rows[idx]
    const path = row.path.trim()
    if (!path) {
      setError('Path is required (e.g. /pricing).')
      return
    }
    if (path === DEFAULT_PATH) {
      setError('Use the brand default editor above for the “*” entry.')
      return
    }
    setError(null)
    setSavingPath(path)
    try {
      // If the path was renamed, drop the old entry so we don't leave an orphan.
      if (row.savedPath && row.savedPath !== path) {
        await remove.mutateAsync({ brand, path: row.savedPath })
      }
      await upsert.mutateAsync({ brand, path, title: row.title, description: row.description, ogImage: row.ogImage })
      updateRow(idx, { savedPath: path })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route')
    } finally {
      setSavingPath(null)
    }
  }

  const deleteAction = useConfirmAction<RouteRow>({
    onConfirm: async (row) => {
      // Unsaved rows only exist locally — just drop them from state.
      if (row.savedPath) {
        await remove.mutateAsync({ brand, path: row.savedPath })
      }
      setRows((prev) => prev.filter((r) => r !== row))
    },
  })

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">SEO</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Per-route page metadata for each brand. The brand default applies to any route without its own entry.
      </p>

      <div className="mt-4 inline-flex rounded-lg border border-border bg-background p-1">
        {BRANDS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => switchBrand(b.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              brand === b.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="mt-6 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Brand default</h3>
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{DEFAULT_PATH}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Used for any route without a specific entry below.</p>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Title" value={defaultForm.title} onChange={(v) => setDefaultForm({ ...defaultForm, title: v })} />
          <Field label="Description" value={defaultForm.description} onChange={(v) => setDefaultForm({ ...defaultForm, description: v })} textarea />
          <Field
            label="OG Image"
            value={defaultForm.ogImage}
            onChange={(v) => setDefaultForm({ ...defaultForm, ogImage: v })}
            placeholder="/og-default.png or https://…"
            mono
          />
          <div className="self-start">
            <PrimaryButton onPress={saveDefault} disabled={savingDefault}>
              {savingDefault ? 'Saving…' : 'Save default'}
            </PrimaryButton>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Routes</h3>
        <PrimaryButton onPress={addRow}>Add route</PrimaryButton>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {rows.map((row, idx) => {
          const dirty = row.savedPath !== row.path || !row.savedPath
          return (
            <div key={row.savedPath || `new-${idx}`} className="rounded-xl border border-border p-4">
              <div className="flex flex-col gap-4">
                <Field
                  label="Path"
                  value={row.path}
                  onChange={(v) => updateRow(idx, { path: v })}
                  placeholder="/pricing"
                  mono
                />
                <Field label="Title" value={row.title} onChange={(v) => updateRow(idx, { title: v })} />
                <Field label="Description" value={row.description} onChange={(v) => updateRow(idx, { description: v })} textarea />
                <Field
                  label="OG Image"
                  value={row.ogImage}
                  onChange={(v) => updateRow(idx, { ogImage: v })}
                  placeholder="/og-default.png or https://… (blank = brand default)"
                  mono
                />
                <div className="flex items-center gap-2">
                  <PrimaryButton onPress={() => saveRow(idx)} disabled={savingPath === row.path || !dirty}>
                    {savingPath === row.path ? 'Saving…' : 'Save'}
                  </PrimaryButton>
                  <SecondaryButton onPress={() => deleteAction.request(row)}>Delete</SecondaryButton>
                </div>
              </div>
            </div>
          )
        })}
        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No route-specific entries yet.</p>
        )}
      </div>

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target?.savedPath ? `Delete SEO for “${deleteAction.target.savedPath}”?` : 'Discard this entry?'}
        description="This removes the per-route metadata. The brand default will apply instead. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={deleteAction.busy}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
  mono,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
  placeholder?: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={mono ? 'font-mono' : undefined} />
      )}
    </div>
  )
}
