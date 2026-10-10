import { useState } from 'react';
import { VehiclePicker } from '@oxy.so/bloom/vehicle-picker';

export default function VehiclePickerExample() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <VehiclePicker value={value} onValueChange={setValue} />
    </div>
  );
}
