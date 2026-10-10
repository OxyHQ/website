import { Sticker } from '@oxy.so/bloom/sticker';

export default function StickerExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Sticker fallback={{ uri: '/images/pricing/oxy-one-hero.png' }} />
    </div>
  );
}
