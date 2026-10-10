import { StatCard } from '@oxy.so/bloom/stat-cards';
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine';

export default function StatCardsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <StatCard
        stat={{
          icon: RiAddLine,
          label: 'New members',
          value: '1,284',
          delta: '+12.8%',
          deltaColor: 'lime',
          caption: 'Over the last 30 days',
        }}
      />
    </div>
  );
}
