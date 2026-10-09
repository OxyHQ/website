import { ConnectionDots } from '@oxy.so/bloom/connection-dots'

export default function ConnectionDotsExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ConnectionDots left={<span>App</span>} right={<span>Oxy</span>} />
    </div>
  )
}
