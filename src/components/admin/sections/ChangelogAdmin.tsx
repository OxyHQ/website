import { useState } from 'react'
import { useChangelog, type ChangelogEntry } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Badge } from '@oxyhq/bloom/badge'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'

export default function ChangelogAdmin() {
  const { data, refetch } = useChangelog()
  const [editing, setEditing] = useState<ChangelogEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const entries = data?.entries ?? []

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

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this changelog entry?')) return
    await apiFetch(`/changelog/${id}`, { method: 'DELETE' })
    await refetch()
  }

  if (editing) {
    return (
      <div>
        <div className="mb-4"><Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back</Button></div>
        <h2 className="text-xl font-semibold text-foreground">{editing._id ? 'Edit Entry' : 'New Entry'}</h2>
        {editing.repoDisplayName && (
          <p className="mt-1 text-xs text-muted-foreground">
            Synced from GitHub: {editing.repoDisplayName} {editing.tagName && `(${editing.tagName})`}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5"><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Date</Label><Input type="date" value={editing.date?.slice(0, 10) ?? ''} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Content (Markdown)</Label><Textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={6} /></div>
          <div className="flex flex-col gap-1.5"><Label>Tags (comma-separated)</Label><Input value={(editing.tags ?? []).join(', ')} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })} /></div>
          <div className="flex flex-col gap-1.5"><Label>Items (one per line)</Label><Textarea value={(editing.items ?? []).join('\n')} onChange={(e) => setEditing({ ...editing, items: e.target.value.split('\n').filter(Boolean) })} rows={4} className="font-mono" /></div>
          <div className="flex flex-col gap-1.5"><Label>Media URL (optional)</Label><Input value={editing.media ?? ''} onChange={(e) => setEditing({ ...editing, media: e.target.value })} placeholder="Image or video URL" /></div>
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
        <PrimaryButton onPress={() => setEditing({ title: '', content: '', tags: [], date: new Date().toISOString(), items: [], media: '' })}>New entry</PrimaryButton>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {entries.map((e) => (
          <div key={e._id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{e.title}</span>
                {e.tagName && <Badge color="default">{e.tagName}</Badge>}
                {e.repoDisplayName && <span className="text-xs text-muted-foreground">{e.repoDisplayName}</span>}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {new Date(e.date).toLocaleDateString()}
                {e.tags?.length > 0 && <> &middot; {e.tags.join(', ')}</>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="small" onPress={() => setEditing({ ...e })}>Edit</Button>
              <Button variant="ghost" size="small" onPress={() => e._id && deleteEntry(e._id)}>Delete</Button>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No entries yet.</p>}
      </div>
    </div>
  )
}
