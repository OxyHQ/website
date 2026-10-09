import { MapPriceMarker, MapClusterMarker } from '@oxy.so/bloom/map-marker'

export default function MapMarkerExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="flex items-center gap-8"><MapPriceMarker price="$950" /><MapClusterMarker count={12} /></div>
    </div>
  )
}
