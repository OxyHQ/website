import { useState } from 'react'
import { useMediaItem, type MediaItem } from '../../api/hooks'
import { SecondaryButton } from '@oxyhq/bloom/button'
import MediaPickerDialog from './MediaPickerDialog'

interface MediaPickerProps {
  value?: string  // Media document ID
  onChange: (mediaId: string | undefined, media?: MediaItem) => void
  folder?: string
  accept?: string
  label?: string
}

export default function MediaPicker({ value, onChange, folder = 'images', accept, label }: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const { data: media } = useMediaItem(value || '')

  const thumbUrl = media?.thumbnails?.md || media?.thumbnails?.lg || media?.url
  const isImage = media?.mimeType?.startsWith('image/')

  return (
    <div>
      {label && <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>}

      {value && media ? (
        <div className="flex items-start gap-4">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
            {isImage && thumbUrl ? (
              <img src={thumbUrl} alt={media.alt || media.filename} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                {media.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{media.filename}</p>
            <div className="flex gap-2">
              <SecondaryButton onPress={() => setOpen(true)} style={{ paddingBlock: 6, paddingInline: 12 }}>
                <span style={{ fontSize: 13 }}>Change</span>
              </SecondaryButton>
              <SecondaryButton onPress={() => onChange(undefined)} style={{ paddingBlock: 6, paddingInline: 12 }}>
                <span style={{ fontSize: 13 }}>Remove</span>
              </SecondaryButton>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface/50 text-sm text-muted-foreground transition-colors hover:border-input hover:bg-surface"
        >
          Choose media
        </button>
      )}

      {open && (
        <MediaPickerDialog
          onSelect={(media) => { onChange(media._id, media); setOpen(false) }}
          onClose={() => setOpen(false)}
          folder={folder}
          accept={accept}
        />
      )}
    </div>
  )
}
