import { Screen } from '@oxy.so/bloom/screen';

export default function ScreenExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="h-48">
        <Screen>
          <p className="p-6">Your next screen starts here.</p>
        </Screen>
      </div>
    </div>
  );
}
