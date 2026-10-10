import { ProgressiveBlur } from '@oxy.so/bloom/progressive-blur';

export default function ProgressiveBlurExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="relative h-44 overflow-hidden rounded-2xl">
        <img
          src="/images/pricing/oxy-one-hero.png"
          alt="Colourful Oxy artwork"
          className="size-full object-cover"
        />
        <ProgressiveBlur />
      </div>
    </div>
  );
}
