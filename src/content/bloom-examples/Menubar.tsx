import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from '@oxy.so/bloom/menubar'

export default function MenubarExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><Menubar><MenubarMenu value="file"><MenubarTrigger>File</MenubarTrigger><MenubarContent><MenubarItem>New project</MenubarItem><MenubarItem>Open project</MenubarItem></MenubarContent></MenubarMenu></Menubar></div>)
}
