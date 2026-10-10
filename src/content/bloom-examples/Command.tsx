import { useState } from 'react';
import { Command } from '@oxy.so/bloom/command';
import { Button } from '@oxy.so/bloom/button';

export default function CommandExample() {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Button onPress={() => setOpen(true)}>Open command menu</Button>
      <Command
        visible={open}
        onClose={() => setOpen(false)}
        items={[
          { id: 'new', label: 'Create a project', onSelect: () => setOpen(false) },
          { id: 'search', label: 'Search your workspace', onSelect: () => setOpen(false) },
        ]}
      />
    </div>
  );
}
