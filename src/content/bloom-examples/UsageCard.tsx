import { UsageCard } from '@oxy.so/bloom/usage-card';

export default function UsageCardExample() {
  return (
    <div className="w-full max-w-lg text-foreground">
      <UsageCard
        title="Example storage"
        usage={{
          max: 100,
          segments: [
            { label: 'Documents', value: 28 },
            { label: 'Photos', value: 42 },
          ],
        }}
        formatValue={(value) => `${value} GB`}
        defaultExpanded
      />
    </div>
  );
}
