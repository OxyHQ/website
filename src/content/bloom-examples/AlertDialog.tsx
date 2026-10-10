import { useState } from 'react';
import { AlertDialog } from '@oxy.so/bloom/alert-dialog';
import { Button } from '@oxy.so/bloom/button';

export default function AlertDialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Button onPress={() => setOpen(true)}>Open alert</Button>
      <AlertDialog
        visible={open}
        onClose={() => setOpen(false)}
        title="Discard changes?"
        description="Your unsaved changes will be lost."
      />
    </div>
  );
}
