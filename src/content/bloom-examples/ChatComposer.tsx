import { useState } from 'react';
import { ChatComposer } from '@oxy.so/bloom/chat-composer';

export default function ChatComposerExample() {
  const [value, setValue] = useState('');
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ChatComposer value={value} onValueChange={setValue} onSend={() => setValue('')} />
    </div>
  );
}
