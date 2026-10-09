import { PressableScale } from '@oxy.so/bloom/pressable-scale'

export default function PressableScaleExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <PressableScale><div className="rounded-2xl bg-primary px-6 py-4 text-primary-foreground">Press and hold</div></PressableScale>
    </div>
  )
}
