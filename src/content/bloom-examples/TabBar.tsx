import { useState } from 'react'
import { TabBar, TabBarButton } from '@oxy.so/bloom/tab-bar'
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine'

export default function TabBarExample() {
  const [value,setValue]=useState(0)
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><TabBar embedded activeIndex={value}>{["Home","Library"].map((label,index)=><TabBarButton key={label} index={index} item={{name:label,label,icon:<RiAddLine />}} onPress={()=>setValue(index)} />)}</TabBar></div>)
}
