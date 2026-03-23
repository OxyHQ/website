import { useState } from 'react'
import { useChangelog } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'

export default function ChangelogAdmin() {
  const { data, refetch } = useChangelog()
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const entries = (data && 'entries' in data ? data.entries : Array.isArray(data) ? data : []) as any[]

  const save = async () => {
    if (!editing) return
    setSaving(true)
    if (editing._id) {
      await apiFetch(`/changelog/${editing._id}`, { method: 'PUT', body: JSON.stringify(editing) })
    } else {
      await apiFetch('/changelog', { method: 'POST', body: JSON.stringify(editing) })
    }
    await refetch()
    setSaving(false)
    setEditing(null)
  }

  if (editing) {
    return (
      <div>
        <div className="mb-4"><Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back</Button></div>
        <h2 className="text-xl font-semibold text-foreground">{editing._id ? 'Edit Entry' : 'New Entry'}</h2>
        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Title</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Date</span><input type="date" value={editing.date?.slice(0, 10) ?? ''} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Content</span><textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Tags (comma-separated)</span><input value={(editing.tags ?? []).join(', ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-foreground">Items (one per line)</span><textarea value={(editing.items ?? []).join('\n')} onChange={(e) => setEditing({ ...editing, items: e.target.value.split('\n').filter(Boolean) })} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary font-mono" /></label>
          <div className="flex gap-3">
            <PrimaryButton onPress={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</PrimaryButton>
            <SecondaryButton onPress={() => setEditing(null)}>Cancel</SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Changelog</h2>
        <PrimaryButton onPress={() => setEditing({ title: '', content: '', tags: [], date: new Date().toISOString(), items: [] })}>New entry</PrimaryButton>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {entries.map((e: any) => (
          <button key={e._id} onClick={() => setEditing({ ...e })} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50">
            <div><span className="text-sm font-medium text-foreground">{e.title}</span><span className="ml-2 text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span></div>
            <span className="text-xs text-muted-foreground">{e.tags?.join(', ')}</span>
          </button>
        ))}
        {entries.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No entries yet.</p>}
      </div>
    </div>
  )
}
