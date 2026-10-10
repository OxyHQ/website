import { MapAttribution } from '@oxy.so/bloom/map-attribution';

export default function MapAttributionExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <MapAttribution credit="Map data © OpenStreetMap contributors" />
    </div>
  );
}
