import { useState } from 'react';
import { FilterChips } from '@oxy.so/bloom/media-shelf';

export default function MediaShelfExample() {
  const [value, setValue] = useState<string | undefined>('all');
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <FilterChips
        options={[
          { value: 'all', label: 'All' },
          { value: 'albums', label: 'Albums' },
          { value: 'artists', label: 'Artists' },
        ]}
        value={value}
        onValueChange={setValue}
      />
    </div>
  );
}
