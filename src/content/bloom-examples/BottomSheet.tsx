import { useState } from 'react';
import { BottomSheet } from '@oxy.so/bloom/bottom-sheet';
import { Button } from '@oxy.so/bloom/button';

export default function BottomSheetExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Button onPress={() => setOpen(true)}>Open bottom sheet</Button>
      <BottomSheet open={open} onDismiss={() => setOpen(false)}>
        <div className="space-y-4 p-8">
          <p>A little more room for the details.</p>
          <Button onPress={() => setOpen(false)}>Close</Button>
        </div>
      </BottomSheet>
    </div>
  );
}
