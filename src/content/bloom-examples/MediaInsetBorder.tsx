import { MediaInsetBorder } from '@oxy.so/bloom/media-inset-border';

export default function MediaInsetBorderExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="relative h-40 overflow-hidden rounded-2xl">
        <img
          src="/images/pricing/oxy-one-hero.png"
          alt="Colourful Oxy artwork"
          className="h-full w-full object-cover"
        />
        <MediaInsetBorder />
      </div>
    </div>
  );
}
