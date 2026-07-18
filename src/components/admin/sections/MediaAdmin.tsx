import { useState } from 'react'
import { useMedia, type MediaItem } from '../../../api/hooks'
import { PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Input } from '../../ui/shadcn/input'
import { Label } from '../../ui/shadcn/label'
import { apiFetch } from '../../../api/client'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'
import MediaPickerDialog from '../MediaPickerDialog'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function MediaAdmin() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<MediaItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const { data, refetch } = useMedia({ search: search || undefined, type: typeFilter || undefined, page, limit: 40 })
  const items = data?.items ?? []
  const totalPages = data?.pages ?? 1

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      await apiFetch(`/media/${editing._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ alt: editing.alt, tags: editing.tags }),
      })
      await refetch()
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const deleteAction = useConfirmAction<MediaItem>({
    onConfirm: async (item) => {
      await apiFetch(`/media/${item._id}`, { method: 'DELETE' })
      await refetch()
      if (editing?._id === item._id) setEditing(null)
    },
  })

  if (editing) {
    const thumb = editing.thumbnails?.lg || editing.url
    const isImage = editing.mimeType?.startsWith('image/')
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Media</h2>
          <SecondaryButton onPress={() => setEditing(null)}>
            <span>Back</span>
          </SecondaryButton>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {isImage ? (
              <img src={thumb} alt={editing.alt || editing.filename} className="w-full object-contain max-h-[400px]" />
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">{editing.mimeType}</div>
            )}
          </div>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Filename:</strong> {editing.filename}</p>
              <p><strong>Type:</strong> {editing.mimeType}</p>
              <p><strong>Size:</strong> {formatBytes(editing.size)}</p>
              {editing.width && editing.height && <p><strong>Dimensions:</strong> {editing.width} &times; {editing.height}</p>}
              <p><strong>Uploaded:</strong> {formatDate(editing.createdAt)}</p>
              <p><strong>URL:</strong> <a href={editing.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline break-all">{editing.url}</a></p>
            </div>

            <div className="space-y-1.5">
              <Label>Alt Text</Label>
              <Input value={editing.alt} onChange={e => setEditing({ ...editing, alt: e.target.value })} placeholder="Describe this image..." />
            </div>

            <div className="space-y-1.5">
              <Label>Tags (comma-separated)</Label>
              <Input value={editing.tags.join(', ')} onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} placeholder="hero, team, product" />
            </div>

            <div className="flex gap-2 pt-2">
              <PrimaryButton onPress={handleSave} disabled={saving}>
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </PrimaryButton>
              <SecondaryButton onPress={() => deleteAction.request(editing)}>
                <span style={{ color: 'var(--color-destructive)' }}>Delete</span>
              </SecondaryButton>
            </div>
          </div>
        </div>

        <ConfirmDialog
          control={deleteAction.control}
          title={deleteAction.target ? `Delete “${deleteAction.target.filename}”?` : 'Delete media?'}
          description="This permanently deletes the file. Any references will break. This cannot be undone."
          confirmLabel="Delete"
          tone="danger"
          busy={deleteAction.busy}
          error={deleteAction.error}
          onConfirm={deleteAction.confirm}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Media Library</h2>
        <PrimaryButton onPress={() => setShowUpload(true)}>
          <span>Upload</span>
        </PrimaryButton>
      </div>

      {/* Search + filters */}
      <div className="flex gap-3">
        <Input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="max-w-xs" />
        <div className="flex gap-1">
          {[['', 'All'], ['image', 'Images'], ['video', 'Videos'], ['document', 'Docs']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => { setTypeFilter(val); setPage(1) }}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${typeFilter === val ? 'bg-foreground text-background' : 'bg-surface text-muted-foreground hover:text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          {search ? 'No results' : 'No media uploaded yet'}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {items.map((item) => {
            const thumb = item.thumbnails?.md || item.thumbnails?.sm || item.url
            const isImage = item.mimeType?.startsWith('image/')
            return (
              <button
                key={item._id}
                onClick={() => setEditing(item)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface transition-all hover:border-input hover:ring-2 hover:ring-ring/30"
              >
                {isImage ? (
                  <img src={thumb} alt={item.alt || item.filename} className="size-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-1 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-8 text-muted-foreground"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">{item.filename}</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-[10px] text-white">{item.filename}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <SecondaryButton onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
            <span>Previous</span>
          </SecondaryButton>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <SecondaryButton onPress={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            <span>Next</span>
          </SecondaryButton>
        </div>
      )}

      {showUpload && (
        <MediaPickerDialog
          onSelect={() => { setShowUpload(false); refetch() }}
          onClose={() => setShowUpload(false)}
          folder="images"
        />
      )}

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target ? `Delete “${deleteAction.target.filename}”?` : 'Delete media?'}
        description="This permanently deletes the file. Any references will break. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={deleteAction.busy}
        error={deleteAction.error}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}
