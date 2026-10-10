import { ChatListItem } from '@oxy.so/bloom/chat-list';

export default function ChatListExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ChatListItem name="Design team" preview={{ text: 'Alex: Ready for the next chapter?' }} />
    </div>
  );
}
