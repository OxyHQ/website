import { EmptyState } from '@oxy.so/bloom/empty-state';

export default function EmptyStateExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <EmptyState title="A fresh start" description="Your saved items will appear here." />
    </div>
  );
}
