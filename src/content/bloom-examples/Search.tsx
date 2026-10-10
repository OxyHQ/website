import { useState } from 'react';
import { Search } from '@oxy.so/bloom/search';

export default function SearchExample() {
  const [value, setValue] = useState('');
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Search
        label="Search examples"
        placeholder="Find something…"
        value={value}
        onChangeText={setValue}
        onClearText={() => setValue('')}
      />
    </div>
  );
}
