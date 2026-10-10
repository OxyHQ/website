import { EvictionReportCard } from '@oxy.so/bloom/eviction';

export default function EvictionExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <EvictionReportCard date="8 October 2026" status="scheduled" area="Barcelona" />
    </div>
  );
}
