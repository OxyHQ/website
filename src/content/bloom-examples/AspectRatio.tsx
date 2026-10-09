import { AspectRatio } from '@oxy.so/bloom/aspect-ratio'

export default function AspectRatioExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <AspectRatio ratio={16/9}><img src="/images/pricing/oxy-one-hero.png" alt="Abstract landscape" className="h-full w-full object-cover rounded-2xl" /></AspectRatio>
    </div>
  )
}
