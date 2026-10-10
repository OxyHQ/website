import { RadioIndicator } from '@oxy.so/bloom/radio-indicator';

export default function RadioIndicatorExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="flex gap-4">
        <RadioIndicator selected />
        <RadioIndicator selected={false} />
      </div>
    </div>
  );
}
