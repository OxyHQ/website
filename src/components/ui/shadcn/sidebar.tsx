import { createContext, forwardRef, useCallback, useContext, useState, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../../lib/utils'
import { Separator } from './separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import { PanelLeft } from 'lucide-react'

/* ── Context ── */

interface SidebarContext {
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContext>({
  open: true,
  setOpen: () => {},
  toggleSidebar: () => {},
})

export function useSidebar() {
  return useContext(SidebarContext)
}

/* ── Provider ── */

export function SidebarProvider({ defaultOpen = true, children }: { defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  const toggleSidebar = useCallback(() => setOpen((o) => !o), [])
  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      <TooltipProvider delayDuration={0}>
        {children}
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

/* ── Sidebar ── */

export const Sidebar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { side?: 'left' | 'right' }>(
  ({ side = 'left', className, children, ...props }, ref) => {
    const { open } = useSidebar()
    return (
      <aside
        ref={ref}
        data-state={open ? 'expanded' : 'collapsed'}
        className={cn(
          'group/sidebar sticky top-0 flex h-screen shrink-0 flex-col border-border bg-surface overflow-hidden transition-[width] duration-200',
          side === 'left' ? 'border-r' : 'border-l',
          open ? 'w-64' : 'w-14',
          className,
        )}
        {...props}
      >
        {children}
      </aside>
    )
  },
)
Sidebar.displayName = 'Sidebar'

/* ── Header ── */

export const SidebarHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2 p-3', className)} {...props} />
  ),
)
SidebarHeader.displayName = 'SidebarHeader'

/* ── Content ── */

export const SidebarContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-1 flex-col gap-1 overflow-y-auto p-2', className)} {...props} />
  ),
)
SidebarContent.displayName = 'SidebarContent'

/* ── Footer ── */

export const SidebarFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2 border-t border-border p-3', className)} {...props} />
  ),
)
SidebarFooter.displayName = 'SidebarFooter'

/* ── Group ── */

export const SidebarGroup = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
  ),
)
SidebarGroup.displayName = 'SidebarGroup'

/* ── Group Label ── */

export const SidebarGroupLabel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { open } = useSidebar()
    return (
      <div
        ref={ref}
        className={cn(
          'truncate px-3 py-1.5 text-xs font-medium text-muted-foreground transition-opacity',
          !open && 'opacity-0',
          className,
        )}
        {...props}
      />
    )
  },
)
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

/* ── Menu ── */

export const SidebarMenu = forwardRef<HTMLUListElement, HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-col gap-0.5', className)} {...props} />
  ),
)
SidebarMenu.displayName = 'SidebarMenu'

/* ── Menu Item ── */

export const SidebarMenuItem = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('', className)} {...props} />
  ),
)
SidebarMenuItem.displayName = 'SidebarMenuItem'

/* ── Menu Button ── */

interface SidebarMenuButtonProps extends HTMLAttributes<HTMLElement> {
  isActive?: boolean
  tooltip?: string
  asChild?: boolean
}

export const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive, tooltip, children, onClick, ...props }, ref) => {
    const { open } = useSidebar()

    const button = (
      <button
        ref={ref}
        data-active={isActive}
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
          'hover:bg-muted',
          isActive && 'bg-primary/10 text-primary font-medium',
          !isActive && 'text-foreground',
          !open && 'justify-center px-0',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )

    if (!open && tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">{tooltip}</TooltipContent>
        </Tooltip>
      )
    }

    return button
  },
)
SidebarMenuButton.displayName = 'SidebarMenuButton'

/* ── Trigger ── */

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      onClick={toggleSidebar}
      className={cn('flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground', className)}
      aria-label="Toggle sidebar"
    >
      <PanelLeft className="size-4" />
    </button>
  )
}

/* ── Separator ── */

export function SidebarSeparator({ className }: { className?: string }) {
  return <Separator className={cn('mx-2 my-1', className)} />
}
