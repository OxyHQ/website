import { AvatarGroup } from '@oxy.so/bloom/avatar-group'

export default function AvatarGroupExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <AvatarGroup items={[{id:"1",name:"Alex Rivera"},{id:"2",name:"Sam Chen"},{id:"3",name:"Taylor Park"},{id:"4",name:"Robin Lee"}]} showInitials max={3} />
    </div>
  )
}
