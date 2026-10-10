import { InputGroup, InputGroupAddon } from '@oxy.so/bloom/input-group';
import { TextFieldInput } from '@oxy.so/bloom/text-field';

export default function InputGroupExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <InputGroup>
        <InputGroupAddon>@</InputGroupAddon>
        <TextFieldInput label="Username" placeholder="username" />
      </InputGroup>
    </div>
  );
}
