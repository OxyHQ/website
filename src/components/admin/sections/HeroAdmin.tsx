import { useState } from 'react'
import { useHero, useUpdateHero, type HeroContent } from '../../../api/hooks'
import { PrimaryButton } from '@oxyhq/bloom/button'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import MediaPicker from '../MediaPicker'

function mediaId(image: unknown): string {
  if (!image) return ''
  if (typeof image === 'string') return image
  if (typeof image === 'object' && image !== null && '_id' in image) {
    const id = (image as { _id?: unknown })._id
    return typeof id === 'string' ? id : ''
  }
  return ''
}

interface HeroForm {
  title: string
  backgroundVideoWebm: string
  backgroundVideoMp4: string
  backgroundPoster: string
}

function toForm(data: HeroContent | undefined): HeroForm {
  return {
    title: data?.title ?? '',
    backgroundVideoWebm: mediaId(data?.backgroundVideoWebm),
    backgroundVideoMp4: mediaId(data?.backgroundVideoMp4),
    backgroundPoster: mediaId(data?.backgroundPoster),
  }
}

export default function HeroAdmin() {
  const { data, refetch } = useHero()
  const updateHero = useUpdateHero()
  const [form, setForm] = useState<HeroForm>(() => toForm(data))
  const [lastSyncedData, setLastSyncedData] = useState(data)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  if (data !== lastSyncedData) {
    setLastSyncedData(data)
    if (data) setForm(toForm(data))
  }

  const save = async () => {
    setStatusMessage(null)
    setSaving(true)
    try {
      await updateHero.mutateAsync({
        title: form.title,
        backgroundVideoWebm: form.backgroundVideoWebm,
        backgroundVideoMp4: form.backgroundVideoMp4,
        backgroundPoster: form.backgroundPoster,
      })
      await refetch()
      setStatusMessage('Saved.')
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Failed to save hero')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Hero</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Homepage hero section: the headline, and the ambient video and poster
        that play in the panel below it.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Title</Label>
          <Textarea
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            rows={3}
            placeholder="Use a newline (Enter) for visual line breaks"
          />
        </div>

        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Background media</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload or pick from the media library. WebM and MP4 are both
            served so browsers get the best-supported format; the poster shows
            before the video starts playing.
          </p>
          <div className="mt-3 flex flex-col gap-4">
            <MediaPicker
              label="Video (WebM)"
              value={form.backgroundVideoWebm}
              onChange={(id) => setForm({ ...form, backgroundVideoWebm: id ?? '' })}
              folder="hero"
              accept="video/webm"
            />
            <MediaPicker
              label="Video (MP4)"
              value={form.backgroundVideoMp4}
              onChange={(id) => setForm({ ...form, backgroundVideoMp4: id ?? '' })}
              folder="hero"
              accept="video/mp4"
            />
            <MediaPicker
              label="Poster image"
              value={form.backgroundPoster}
              onChange={(id) => setForm({ ...form, backgroundPoster: id ?? '' })}
              folder="hero"
              accept="image/*"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 self-start">
          <PrimaryButton onPress={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </PrimaryButton>
          {statusMessage && (
            <span className="text-xs text-muted-foreground">{statusMessage}</span>
          )}
        </div>
      </div>
    </div>
  )
}
