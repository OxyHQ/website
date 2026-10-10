import { MediaSurface } from '@oxy.so/bloom/media-flight';

export default function MediaFlightExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <MediaSurface
        content={{ uri: '/images/pricing/oxy-one-hero.png' }}
        style={{ height: 180, width: '100%' }}
      />
    </div>
  );
}
