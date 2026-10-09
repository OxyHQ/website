import { ContextMenu, ContextMenuTrigger, ContextMenuContent } from '@oxy.so/bloom/context-menu'

export default function ContextMenuExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><ContextMenu><ContextMenuTrigger><div className="rounded-xl border border-border p-8">Right-click or long-press here</div></ContextMenuTrigger><ContextMenuContent><div className="p-4">Contextual actions</div></ContextMenuContent></ContextMenu></div>)
}
