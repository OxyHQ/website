import { CollectionHeader } from '@oxy.so/bloom/media-header'

export default function MediaHeaderExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <CollectionHeader typeLabel="Playlist" title="A little focus" />
    </div>
  )
}
