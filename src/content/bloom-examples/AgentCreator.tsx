import { useState } from 'react'
import { AgentCreator } from '@oxy.so/bloom/agent-creator'
import { DEFAULT_CONFIG } from '@oxy.so/bloom/agent-avatar'

export default function AgentCreatorExample() {
  const [agent,setAgent]=useState({id:"alex",name:"Alex",label:"Research assistant",description:"Helps your team explore ideas.",avatar:DEFAULT_CONFIG})
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><AgentCreator agent={agent} onChange={setAgent} /></div>)
}
