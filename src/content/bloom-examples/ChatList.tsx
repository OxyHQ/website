import { List } from '@oxy.so/bloom/list';

export default function ChatListExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <List
        items={[
          {
            id: 'design',
            conversation: {
              name: 'Design team',
              preview: { sender: 'Alex', text: 'Ready for the next chapter?' },
            },
          },
        ]}
      />
    </div>
  );
}
