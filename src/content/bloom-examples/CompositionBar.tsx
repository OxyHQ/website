import { useState } from 'react'
import { CompositionBar } from '@oxy.so/bloom/composition-bar'

export default function CompositionBarExample() {
  const [value,setValue]=useState<string|null>(null)
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><CompositionBar categories={[{key:"design",name:"Design",amount:60,color:"var(--primary)"},{key:"build",name:"Build",amount:40,color:"var(--secondary)"}]} selectedKey={value} onSelect={setValue} hintLabel="Project composition" /></div>)
}
