import { Avatar } from '@oxyhq/bloom/avatar'
import type { AvatarShape } from '@oxyhq/bloom/avatar'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Profile image with deterministic fallback color and initials.',
}

export default function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar name="Ada Lovelace" size={56} />
      <Avatar name="Grace Hopper" size={56} />
      <Avatar name="Linus Torvalds" size={56} />
      <Avatar
        size={56}
        source="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"
        name="Photo"
      />
      <Avatar name="Squircle" size={56} shape="squircle" />
      <Avatar name="Verified" size={56} verified />
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const name = typeof values.name === 'string' ? values.name : 'Ada Lovelace'
  const size = typeof values.size === 'number' ? values.size : 56
  const shape = values.shape === 'squircle' ? 'squircle' : ('circle' satisfies AvatarShape)
  const verified = values.verified === true
  const source = typeof values.source === 'string' && values.source ? values.source : undefined
  return <Avatar name={name} size={size} shape={shape} verified={verified} source={source} />
}
