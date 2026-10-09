import { PresenceDot, MessageStatus, UnreadBadge } from '@oxy.so/bloom/chat-indicators'

export default function ChatIndicatorsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="flex items-center gap-6"><PresenceDot status="online" /><MessageStatus status="read" /><UnreadBadge count={3} /></div>
    </div>
  )
}
