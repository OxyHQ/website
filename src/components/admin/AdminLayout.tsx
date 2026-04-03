import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@oxyhq/auth'
import { Avatar } from '@oxyhq/bloom/avatar'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '../ui/shadcn/sidebar'
import {
  Settings,
  Menu,
  LayoutTemplate,
  FileText,
  PenSquare,
  Tag,
  Quote,
  Clock,
  Briefcase,
  KeyRound,
  Languages,
  ArrowLeft,
} from 'lucide-react'

export { ADMIN_USERNAMES } from '../../constants'

interface AdminSection {
  id: string
  label: string
  icon: ReactNode
  group: string
}

const sections: AdminSection[] = [
  { id: 'settings', label: 'Site Settings', icon: <Settings className="size-4" />, group: 'Configuration' },
  { id: 'navigation', label: 'Navigation', icon: <Menu className="size-4" />, group: 'Configuration' },
  { id: 'footer', label: 'Footer', icon: <LayoutTemplate className="size-4" />, group: 'Configuration' },
  { id: 'pages', label: 'Pages', icon: <FileText className="size-4" />, group: 'Content' },
  { id: 'newsroom', label: 'Newsroom', icon: <PenSquare className="size-4" />, group: 'Content' },
  { id: 'pricing', label: 'Pricing', icon: <Tag className="size-4" />, group: 'Content' },
  { id: 'testimonials', label: 'Testimonials', icon: <Quote className="size-4" />, group: 'Content' },
  { id: 'changelog', label: 'Changelog', icon: <Clock className="size-4" />, group: 'Content' },
  { id: 'jobs', label: 'Jobs', icon: <Briefcase className="size-4" />, group: 'Content' },
  { id: 'locales', label: 'Locales', icon: <Languages className="size-4" />, group: 'Configuration' },
  { id: 'mcp-tokens', label: 'API Tokens', icon: <KeyRound className="size-4" />, group: 'Developer' },
]

const groups = [...new Set(sections.map((s) => s.group))]

function AdminSidebar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { open } = useSidebar()
  const activeSection = pathname.split('/admin/')[1]?.split('/')[0] ?? 'settings'

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-1">
          <Avatar source={user?.avatar} size={open ? 28 : 24} placeholderColor={user?.color} />
          {open && (
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">Admin</div>
              <div className="truncate text-xs text-muted-foreground">@{user?.username}</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarMenu>
              {sections.filter((s) => s.group === group).map((s) => (
                <SidebarMenuItem key={s.id}>
                  <Link to={`/admin/${s.id}`}>
                    <SidebarMenuButton isActive={activeSection === s.id} tooltip={s.label}>
                      {s.icon}
                      {open && <span>{s.label}</span>}
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <Link to="/">
          <SidebarMenuButton tooltip="Back to site">
            <ArrowLeft className="size-4" />
            {open && <span>Back to site</span>}
          </SidebarMenuButton>
        </Link>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <SidebarTrigger />
          </div>
          <div className="mx-auto max-w-4xl px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
