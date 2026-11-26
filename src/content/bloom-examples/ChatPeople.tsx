import { List } from '@oxy.so/bloom/list';

export default function ChatPeopleExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <List items={[{ id: 'alex', person: { name: 'Alex Rivera' } }]} />
    </div>
  );
}
