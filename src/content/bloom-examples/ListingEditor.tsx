import { useState } from 'react';
import { AddressPrecisionPicker } from '@oxy.so/bloom/listing-editor';

export default function ListingEditorExample() {
  const [value, setValue] =
    useState<import('@oxy.so/bloom/listing-editor').AddressPrecision>('exact');
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <AddressPrecisionPicker value={value} onValueChange={setValue} />
    </div>
  );
}
