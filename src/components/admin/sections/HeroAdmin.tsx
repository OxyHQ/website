import { useState } from 'react'
import { useHero, useUpdateHero, type HeroContent } from '../../../api/hooks'
import { PrimaryButton } from '@oxyhq/bloom/button'
import { Textarea } from '../../ui/shadcn/textarea'
import { Input } from '../../ui/shadcn/input'
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
  eyebrow: string
  backgroundVideoWebm: string
  backgroundVideoMp4: string
  backgroundPoster: string
  /** Carousel slots are edited as raw JSON for now — admins rarely touch them. */
  carouselSlotsJson: string
}

function toForm(data: HeroContent | undefined): HeroForm {
  return {
    title: data?.title ?? '',
    eyebrow: data?.eyebrow ?? '',
    backgroundVideoWebm: mediaId(data?.backgroundVideoWebm),
    backgroundVideoMp4: mediaId(data?.backgroundVideoMp4),
    backgroundPoster: mediaId(data?.backgroundPoster),
    carouselSlotsJson: JSON.stringify(data?.carouselSlots ?? [], null, 2),
  }
}

export default function HeroAdmin() {
  const { data, refetch } = useHero()
  const updateHero = useUpdateHero()
  const [form, setForm] = useState<HeroForm>(() => toForm(data))
  const [lastSyncedData, setLastSyncedData] = useState(data)
  const [saving, setSaving] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  if (data !== lastSyncedData) {
    setLastSyncedData(data)
    if (data) setForm(toForm(data))
  }

  const save = async () => {
    setJsonError(null)
    setStatusMessage(null)

    let parsedSlots: HeroContent['carouselSlots']
    try {
      const parsed: unknown = JSON.parse(form.carouselSlotsJson)
      if (!Array.isArray(parsed)) {
        setJsonError('Carousel slots must be a JSON array.')
        return
      }
      parsedSlots = parsed as HeroContent['carouselSlots']
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON')
      return
    }

    setSaving(true)
    try {
      await updateHero.mutateAsync({
        title: form.title,
        eyebrow: form.eyebrow,
        backgroundVideoWebm: form.backgroundVideoWebm,
        backgroundVideoMp4: form.backgroundVideoMp4,
        backgroundPoster: form.backgroundPoster,
        carouselSlots: parsedSlots,
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
        Homepage hero section: title, eyebrow text, background video and poster, plus the
        carousel slot grid below the headline.
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

        <div className="flex flex-col gap-1.5">
          <Label>Eyebrow (small caps line)</Label>
          <Input
            value={form.eyebrow}
            onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
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

        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Carousel slots</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Raw JSON of the slot grid. Each slot has a <code className="font-mono">size</code>,
            an array of <code className="font-mono">faces</code>, and optional rotation/styling
            flags. Newsroom and careers face arrays are auto-populated from live data at
            render time.
          </p>
          <Textarea
            value={form.carouselSlotsJson}
            onChange={(e) => setForm({ ...form, carouselSlotsJson: e.target.value })}
            rows={20}
            className="mt-3 font-mono text-xs"
          />
          {jsonError && (
            <p className="mt-2 text-xs text-destructive">JSON error: {jsonError}</p>
          )}
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
