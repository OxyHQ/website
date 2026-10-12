import { useRef, useState } from 'react';
import { Collapsible } from '@oxy.so/bloom/collapsible';

export default function CollapsibleExample() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div className="w-full max-w-md space-y-3 text-foreground">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="bloom-collapse-details"
        className="rounded-lg border border-border px-4 py-2"
        onClick={() => setOpen(!open)}
      >
        Delivery details
      </button>
      <Collapsible open={open} nativeID="bloom-collapse-details" returnFocusRef={trigger}>
        <p className="py-3">Your order ships within two business days.</p>
      </Collapsible>
    </div>
  );
}
