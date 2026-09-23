import { useState, useRef, useCallback } from 'react'
import { useMedia, type MediaItem } from '../../api/hooks'
import { Button, SecondaryButton } from '@oxy.so/bloom/button'
import { Dialog } from '@oxy.so/bloom/dialog'
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine'
import { RiFileTextLine } from '@oxy.so/bloom/icons/RiFileTextLine'
import { RiUploadCloud2Line } from '@oxy.so/bloom/icons/RiUploadCloud2Line'
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control'
import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs'
import { useTheme } from '@oxy.so/bloom/theme'
import { LabeledTextField } from './LabeledTextField'
import { BloomSelectionKeys } from '../ui/BloomSelectionKeys'
import { API_BASE, getAuthHeaders } from '../../api/client'
import { useQueryClient } from '@tanstack/react-query'

type MediaTab = 'library' | 'upload'

// 'all' rather than '' — a segmented control reads an empty value as "nothing
// selected", and "All" is a real choice here.
const TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'document', label: 'Documents' },
] as const
type TypeFilter = (typeof TYPE_FILTERS)[number]['value']

interface MediaPickerDialogProps {
  onSelect: (media: MediaItem) => void
  onClose: () => void
  folder?: string
  accept?: string
}

export default function MediaPickerDialog({ onSelect, onClose, folder = 'images', accept }: MediaPickerDialogProps) {
  const [tab, setTab] = useState<MediaTab>('library')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { colors } = useTheme()

  const { data } = useMedia({ search: search || undefined, type: typeFilter === 'all' ? undefined : typeFilter, limit: 40 })
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
    // The parent mounts this only while it is open, so the dialog is always
    // open here; `scrollable={false}` keeps the header and tabs fixed while the
    // content pane below scrolls on its own.
    <Dialog open onClose={onClose} maxWidth={768} maxHeightRatio={0.8} contentPadding={0} scrollable={false} label="Media Library">
      <div className="flex max-h-[80vh] w-full flex-col text-start">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Media Library</h2>
          <Button
            iconOnly
            size="sm"
            appearance="plain"
            tone="neutral"
            leadingIcon={RiCloseLine}
            accessibilityLabel="Close"
            onPress={onClose}
          />
        </div>

        {/* Tabs */}
        <BloomSelectionKeys item="tab" label="Media source" className="border-b border-border px-4">
          <Tabs value={tab} onValueChange={(next) => setTab(next as MediaTab)}>
            <TabsTrigger value="library" label="Library" />
            <TabsTrigger value="upload" label="Upload" />
          </Tabs>
        </BloomSelectionKeys>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
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
                  <RiUploadCloud2Line aria-hidden size="3xl" fill={colors.textSecondary} style={{ marginBottom: 12 }} />
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
              <div className="mb-4 flex flex-wrap items-end gap-3">
                <LabeledTextField
                  label="Search media"
                  placeholder="Search media..."
                  value={search}
                  onValueChange={setSearch}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <BloomSelectionKeys item="radio">
                  <SegmentedControl
                    type="radio"
                    size="sm"
                    label="Media type"
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    {TYPE_FILTERS.map((filter) => (
                      <SegmentedControlItem key={filter.value} value={filter.value}>
                        <SegmentedControlItemText>{filter.label}</SegmentedControlItemText>
                      </SegmentedControlItem>
                    ))}
                  </SegmentedControl>
                </BloomSelectionKeys>
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
                            <RiFileTextLine aria-hidden size="lg" fill={colors.textSecondary} />
                            <span className="text-label-sm text-muted-foreground truncate w-full text-center">{item.filename}</span>
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
    </Dialog>
  )
}
