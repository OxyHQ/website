import { ActivityHeatmap } from '@oxy.so/bloom/activity-heatmap';

export default function ActivityHeatmapExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ActivityHeatmap
        numDays={84}
        endDate="2026-10-08"
        data={Array.from({ length: 84 }, (_, i) => ({
          date: new Date(Date.UTC(2026, 6, 17 + i)).toISOString().slice(0, 10),
          count: (i * 7) % 11,
        }))}
      />
    </div>
  );
}
