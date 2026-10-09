import { Field } from '@oxy.so/bloom/field'
import { TextField, TextFieldLabel, TextFieldInput } from '@oxy.so/bloom/text-field'

export default function FieldExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Field><TextField><TextFieldLabel>Project name</TextFieldLabel><TextFieldInput label="Project name" placeholder="A new idea" /></TextField></Field>
    </div>
  )
}
