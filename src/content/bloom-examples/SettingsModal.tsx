import { useState } from 'react'
import { SettingsModal } from '@oxy.so/bloom/settings-modal'
import { Button } from '@oxy.so/bloom/button'
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine'

export default function SettingsModalExample() {
  const [open,setOpen]=useState(false)
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><Button onPress={()=>setOpen(true)}>Open settings</Button><SettingsModal open={open} onClose={()=>setOpen(false)} groups={[{label:"Workspace",items:[{key:"general",label:"General",icon:RiAddLine}]}]} pages={{general:{title:"General",content:<p className="p-6">Your workspace preferences.</p>}}} /></div>)
}
