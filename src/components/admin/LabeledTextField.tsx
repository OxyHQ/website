import { Field } from '@oxy.so/bloom/field'
import { TextFieldInput, type TextFieldInputProps } from '@oxy.so/bloom/text-field'

/**
 * `TextFieldInput` rendered standalone (no enclosing `<TextField>`/`<Field>`)
 * wraps itself in a field shell, but its `label` prop only becomes the
 * accessible name — it never renders a visible caption the way `Textarea`'s
 * own `label` does. Every admin form here expects a visible label above the
 * control, so this composes the two the way Bloom's own `Field` is meant to
 * be used, under the same flat prop shape every call site already passes.
 */
export function LabeledTextField({ label, ...rest }: TextFieldInputProps) {
  return (
    <Field label={label}>
      <TextFieldInput label={label} {...rest} />
    </Field>
  )
}
