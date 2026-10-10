import { toast } from '@oxy.so/bloom/toast';
import { Button } from '@oxy.so/bloom/button';

export default function ToastExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Button onPress={() => toast.success('Changes saved')}>Show toast</Button>
    </div>
  );
}
