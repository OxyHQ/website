import { useState } from 'react'
import { BottomBar } from '@oxy.so/bloom/bottom-bar'
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine'

export default function BottomBarExample() {
  const [value,setValue]=useState("home")
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><BottomBar items={[{name:"home",label:"Home",icon:<RiAddLine />},{name:"library",label:"Library",icon:<RiAddLine />}]} value={value} onValueChange={setValue} /></div>)
}
