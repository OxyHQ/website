import { List } from '@oxy.so/bloom/list';

export default function MailListExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <List
        items={[
          {
            id: 'perspective',
            mail: { sender: { name: 'Alex Rivera' }, subject: 'A fresh perspective' },
          },
        ]}
      />
    </div>
  );
}
