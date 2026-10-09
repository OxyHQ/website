import { MailRow } from '@oxy.so/bloom/mail-list'

export default function MailListExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <MailRow sender={{name:"Alex Rivera"}} subject="A fresh perspective" />
    </div>
  )
}
