import { useState } from 'react';
import { TextField, TextFieldInput } from '@oxy.so/bloom/text-field';
import type { PlaygroundValues } from './_playground';

export const meta = {
  description: 'Labelled text input with focus / error chrome.',
};

export default function TextFieldDemo() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex@example.com');
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <TextField>
        <TextFieldInput
          label="Full name"
          value={name}
          onValueChange={setName}
          placeholder="Ada Lovelace"
        />
      </TextField>
      <TextField>
        <TextFieldInput label="Email" value={email} onValueChange={setEmail} />
      </TextField>
      <TextField invalid>
        <TextFieldInput label="Username" value="taken" onValueChange={() => undefined} invalid />
      </TextField>
    </div>
  );
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const label = typeof values.label === 'string' ? values.label : 'Label';
  const value = typeof values.value === 'string' ? values.value : '';
  const placeholder = typeof values.placeholder === 'string' ? values.placeholder : undefined;
  const invalid = values.invalid === true;
  const [text, setText] = useState(value);
  // Reset internal state when the knob's "value" changes via derived state.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }
  return (
    <div style={{ width: 280 }}>
      <TextField invalid={invalid}>
        <TextFieldInput
          label={label}
          value={text}
          onValueChange={setText}
          placeholder={placeholder}
          invalid={invalid}
        />
      </TextField>
    </div>
  );
}
