import { useState } from 'react';
import { Text } from 'react-native';
import { ChoiceList } from '@oxy.so/bloom/choice-list';

const options = [
  { value: 'personal', label: 'Personal' },
  { value: 'team', label: 'Team' },
] as const;

export default function ChoiceListExample() {
  const [value, setValue] = useState<string>('personal');
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ChoiceList
        label="Workspace"
        value={value}
        onValueChange={setValue}
        options={options}
        renderContent={(option, state) => (
          <Text>{state.selected ? `${option.label} (chosen)` : option.label}</Text>
        )}
      />
    </div>
  );
}
