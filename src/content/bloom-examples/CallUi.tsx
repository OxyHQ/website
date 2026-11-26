import { List } from '@oxy.so/bloom/list';

export default function CallUiExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <List
        items={[
          {
            id: 'alex',
            call: { name: 'Alex Rivera', direction: 'incoming', meta: 'Today, 10:30 · 12 min' },
          },
        ]}
      />
    </div>
  );
}
