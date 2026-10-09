import { CallHistoryRow } from '@oxy.so/bloom/call-ui'

export default function CallUiExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <CallHistoryRow name="Alex Rivera" direction="incoming" meta="Today, 10:30 · 12 min" />
    </div>
  )
}
