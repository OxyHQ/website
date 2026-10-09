import { MapCompass } from '@oxy.so/bloom/map-controls'

export default function MapControlsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <MapCompass heading={35} />
    </div>
  )
}
