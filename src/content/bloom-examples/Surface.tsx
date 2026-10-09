import { Surface } from '@oxy.so/bloom/surface'

export default function SurfaceExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Surface><div className="p-6"><h3 className="font-medium">A shared surface</h3><p>Content that belongs together.</p></div></Surface>
    </div>
  )
}
