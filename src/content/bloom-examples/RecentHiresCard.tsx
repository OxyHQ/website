import { RecentHiresCard } from '@oxy.so/bloom/recent-hires-card';

export default function RecentHiresCardExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <RecentHiresCard
        count={2}
        hires={[
          { name: 'Alex Rivera', role: 'Product designer', joined: 'Oct 1', initials: 'AR' },
          { name: 'Sam Chen', role: 'Engineer', joined: 'Oct 3', initials: 'SC' },
        ]}
      />
    </div>
  );
}
