import { useState, useRef, useCallback } from 'react'
import { useMedia, type MediaItem } from '../../api/hooks'
import { SecondaryButton } from '@oxyhq/bloom/button'
import { Input } from '../ui/shadcn/input'
import { API_BASE, getAuthHeaders } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'

interface MediaPickerDialogProps {
  onSelect: (media: MediaItem) => void
  onClose: () => void
  folder?: string
  accept?: string
}

export default function MediaPickerDialog({ onSelect, onClose, folder = 'images', accept }: MediaPickerDialogProps) {
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data } = useMedia({ search: search || undefined, type: typeFilter || undefined, limit: 40 })
  const items = data?.items ?? []

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      const authHeaders = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
        headers: authHeaders,
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Upload failed')
      const media: MediaItem = await res.json()
      queryClient.invalidateQueries({ queryKey: ['media'] })
      onSelect(media)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
    }
  }, [folder, onSelect, queryClient])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Media Library</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('library')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${tab === 'library' ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Library
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${tab === 'upload' ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Upload
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'upload' ? (
            <div
              className={`flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${dragOver ? 'border-foreground bg-surface' : 'border-border'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="mb-3 size-10 text-muted-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm text-muted-foreground">Drag and drop a file here</p>
                  <p className="mt-1 text-xs text-muted-foreground">or</p>
                  <SecondaryButton onPress={() => fileRef.current?.click()} style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 13 }}>Browse files</span>
                  </SecondaryButton>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </>
              )}
            </div>
          ) : (
            <>
              {/* Search + filters */}
              <div className="mb-4 flex gap-3">
                <Input
                  placeholder="Search media..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {['', 'image', 'video', 'document'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${typeFilter === t ? 'bg-foreground text-background' : 'bg-surface text-muted-foreground hover:text-foreground'}`}
                    >
                      {t || 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              {items.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  {search ? 'No results found' : 'No media yet. Upload something!'}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6">
                  {items.map((item) => {
                    const thumb = item.thumbnails?.md || item.thumbnails?.lg || item.url
                    const isImg = item.mimeType?.startsWith('image/')
                    return (
                      <button
                        key={item._id}
                        onClick={() => onSelect(item)}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface transition-all hover:border-input hover:ring-2 hover:ring-ring/30"
                      >
                        {isImg ? (
                          <img src={thumb} alt={item.alt || item.filename} className="size-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex size-full flex-col items-center justify-center gap-1 p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="size-6 text-muted-foreground"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                            <span className="text-[10px] text-muted-foreground truncate w-full text-center">{item.filename}</span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
