import { useState } from 'react';
import { StepperRow } from '@oxy.so/bloom/stepper';

export default function StepperExample() {
  const [value, setValue] = useState(2);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <StepperRow title="Seats" value={value} onValueChange={setValue} min={1} max={20} />
    </div>
  );
}
