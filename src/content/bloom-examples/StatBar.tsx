import { Meter, MeterRing } from '@oxy.so/bloom/stat-bar';

export default function StatBarExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="space-y-6">
        <Meter accessibilityLabel="Storage used" max={100} value={65} />
        <MeterRing max={100} value={65} accessibilityLabel="65 percent complete" />
      </div>
    </div>
  );
}
