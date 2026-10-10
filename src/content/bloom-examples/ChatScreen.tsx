import { ChatHeader, ChatDateHeader } from '@oxy.so/bloom/chat-screen';

export default function ChatScreenExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <>
        <ChatHeader title="Design team" />
        <ChatDateHeader label="Today" />
      </>
    </div>
  );
}
