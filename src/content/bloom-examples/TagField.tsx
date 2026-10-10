import { useState } from 'react';
import { TagField } from '@oxy.so/bloom/tag-field';

export default function TagFieldExample() {
  const [value, setValue] = useState<readonly string[]>(['Design', 'Ideas']);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <TagField value={value} onChange={setValue} />
    </div>
  );
}
