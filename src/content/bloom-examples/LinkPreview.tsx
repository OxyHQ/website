import { LinkPreviewCard } from '@oxy.so/bloom/link-preview';

export default function LinkPreviewExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <LinkPreviewCard
        url="https://oxy.so"
        title="Oxy"
        description="Open apps, built around you."
      />
    </div>
  );
}
