import { MailMessage } from '@oxy.so/bloom/mail-thread';

export default function MailThreadExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <MailMessage sender={{ name: 'Alex Rivera', address: 'alex@example.com' }}>
        Thanks for sharing your ideas. Let’s build something useful together.
      </MailMessage>
    </div>
  );
}
