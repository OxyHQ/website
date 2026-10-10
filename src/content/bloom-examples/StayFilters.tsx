import { useState } from 'react';
import { CountFilter } from '@oxy.so/bloom/stay-filters';

export default function StayFiltersExample() {
  const [value, setValue] = useState<number | null>(2);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <CountFilter title="Bedrooms" value={value} onValueChange={setValue} />
    </div>
  );
}
