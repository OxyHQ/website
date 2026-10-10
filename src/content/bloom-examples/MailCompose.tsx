import { useState } from 'react';
import { MailRecipientField } from '@oxy.so/bloom/mail-compose';

export default function MailComposeExample() {
  const [recipients, setRecipients] = useState<
    import('@oxy.so/bloom/mail-compose').MailRecipient[]
  >([{ id: 'alex', address: 'alex@example.com', name: 'Alex Rivera' }]);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <MailRecipientField recipients={recipients} onRecipientsChange={setRecipients} />
    </div>
  );
}
