import { Textarea } from '@oxy.so/bloom/textarea';
import { LabeledTextField } from './LabeledTextField';

/** A labelled admin form field: a single-line text field, or a textarea when `textarea` is set. */
export function AdminField({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
}) {
  if (textarea) {
    return (
      <Textarea
        label={label}
        value={value}
        onValueChange={onChange}
        rows={rows}
        placeholder={placeholder}
      />
    );
  }
  return (
    <LabeledTextField
      label={label}
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      style={mono ? { fontFamily: 'monospace' } : undefined}
    />
  );
}
