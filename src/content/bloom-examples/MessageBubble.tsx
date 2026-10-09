import { MessageBubble } from '@oxy.so/bloom/message-bubble'

export default function MessageBubbleExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <><MessageBubble direction="incoming">Have you seen the new components?</MessageBubble><MessageBubble direction="outgoing">Yes! The previews look great.</MessageBubble></>
    </div>
  )
}
