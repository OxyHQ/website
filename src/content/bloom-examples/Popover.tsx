import { Popover, PopoverTrigger, PopoverContent } from '@oxy.so/bloom/popover'
import { Button } from '@oxy.so/bloom/button'

export default function PopoverExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><Popover><PopoverTrigger asChild><Button>Open popover</Button></PopoverTrigger><PopoverContent><div className="p-4">Keep useful details close to the action.</div></PopoverContent></Popover></div>)
}
