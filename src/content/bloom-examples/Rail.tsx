import { useState } from 'react'
import { Rail } from '@oxy.so/bloom/rail'
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine'

export default function RailExample() {
  const [value,setValue]=useState("home")
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><Rail items={[{id:"home",label:"Home",icon:<RiAddLine width={20} height={20} />},{id:"library",label:"Library",icon:<RiAddLine width={20} height={20} />}]} activeId={value} onSelect={setValue} /></div>)
}
