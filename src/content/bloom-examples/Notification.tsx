import { Notification } from '@oxy.so/bloom/notification'

export default function NotificationExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Notification title="All changes saved" description="Your workspace is up to date." status="success" />
    </div>
  )
}
