import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigate } from '../../lib/navigation'
import { useAuth, useOxy } from '@oxy.so/services/ui/client'
import { AppShell, AppShellMenuButton } from '@oxy.so/bloom/app-shell'
import { PageHeader } from '@oxy.so/bloom/page-header'
import type { SidebarNavItem } from '@oxy.so/bloom/sidebar'
import { RiSettings4Line } from '@oxy.so/bloom/icons/RiSettings4Line'
import { RiSearchLine } from '@oxy.so/bloom/icons/RiSearchLine'
import { RiSparklingLine } from '@oxy.so/bloom/icons/RiSparklingLine'
import { RiFileTextLine } from '@oxy.so/bloom/icons/RiFileTextLine'
import { RiShoppingBag3Line } from '@oxy.so/bloom/icons/RiShoppingBag3Line'
import { RiAlarmWarningLine } from '@oxy.so/bloom/icons/RiAlarmWarningLine'
import { RiFolder6Line } from '@oxy.so/bloom/icons/RiFolder6Line'
import { RiNewspaperLine } from '@oxy.so/bloom/icons/RiNewspaperLine'
import { RiSchoolLine } from '@oxy.so/bloom/icons/RiSchoolLine'
import { RiBookOpenLine } from '@oxy.so/bloom/icons/RiBookOpenLine'
import { RiCustomerService2Line } from '@oxy.so/bloom/icons/RiCustomerService2Line'
import { RiPriceTag3Line } from '@oxy.so/bloom/icons/RiPriceTag3Line'
import { RiDoubleQuotesL } from '@oxy.so/bloom/icons/RiDoubleQuotesL'
import { RiHistoryLine } from '@oxy.so/bloom/icons/RiHistoryLine'
import { RiTeamLine } from '@oxy.so/bloom/icons/RiTeamLine'
import { RiImageLine } from '@oxy.so/bloom/icons/RiImageLine'
import { RiTranslate2 } from '@oxy.so/bloom/icons/RiTranslate2'
import { RiGitMergeLine } from '@oxy.so/bloom/icons/RiGitMergeLine'
import { RiArchiveLine } from '@oxy.so/bloom/icons/RiArchiveLine'
import { RiChat3Line } from '@oxy.so/bloom/icons/RiChat3Line'
import { RiLightbulbLine } from '@oxy.so/bloom/icons/RiLightbulbLine'
import { RiMedalLine } from '@oxy.so/bloom/icons/RiMedalLine'
import { RiUserAddLine } from '@oxy.so/bloom/icons/RiUserAddLine'
import { RiArrowLeftLine } from '@oxy.so/bloom/icons/RiArrowLeftLine'

interface AdminSection {
  id: string
  label: string
  icon: SidebarNavItem['icon']
}

/**
 * `secondaryItems` reads as a visually distinct, pinned-to-bottom group —
 * the closest the sidebar's flat `items` list gets to the old panel's
 * "Developer" / "Community" headings, so the lower-traffic sections go there.
 */
const PRIMARY_SECTIONS: AdminSection[] = [
  { id: 'settings', label: 'Site Settings', icon: RiSettings4Line },
  { id: 'seo', label: 'SEO', icon: RiSearchLine },
  { id: 'hero', label: 'Hero', icon: RiSparklingLine },
  { id: 'pages', label: 'Pages', icon: RiFileTextLine },
  { id: 'products', label: 'Products', icon: RiShoppingBag3Line },
  { id: 'incidents', label: 'Incidents', icon: RiAlarmWarningLine },
  { id: 'categories', label: 'Categories', icon: RiFolder6Line },
  { id: 'newsroom', label: 'Newsroom', icon: RiNewspaperLine },
  { id: 'courses', label: 'Courses', icon: RiSchoolLine },
  { id: 'resources', label: 'Resources', icon: RiBookOpenLine },
  { id: 'help', label: 'Help Center', icon: RiCustomerService2Line },
  { id: 'pricing', label: 'Pricing', icon: RiPriceTag3Line },
  { id: 'testimonials', label: 'Testimonials', icon: RiDoubleQuotesL },
  { id: 'changelog', label: 'Changelog', icon: RiHistoryLine },
  { id: 'team', label: 'Team', icon: RiTeamLine },
  { id: 'media', label: 'Media', icon: RiImageLine },
  { id: 'locales', label: 'Locales', icon: RiTranslate2 },
]

const SECONDARY_SECTIONS: AdminSection[] = [
  { id: 'repos', label: 'Repositories', icon: RiGitMergeLine },
  { id: 'backup', label: 'Backup', icon: RiArchiveLine },
  { id: 'comments', label: 'Comments', icon: RiChat3Line },
  { id: 'features', label: 'Feature Board', icon: RiLightbulbLine },
  { id: 'badges', label: 'Badges', icon: RiMedalLine },
  { id: 'referrals', label: 'Referrals', icon: RiUserAddLine },
]

const ALL_SECTIONS = [...PRIMARY_SECTIONS, ...SECONDARY_SECTIONS]

function toNavItems(list: AdminSection[]): SidebarNavItem[] {
  return list.map((section) => ({ key: section.id, label: section.label, icon: section.icon, href: `/admin/${section.id}` }))
}

const PRIMARY_ITEMS = toNavItems(PRIMARY_SECTIONS)
const SECONDARY_ITEMS: SidebarNavItem[] = [
  ...toNavItems(SECONDARY_SECTIONS),
  { key: 'back-to-site', label: 'Back to site', icon: RiArrowLeftLine, href: '/' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { openAccountDialog } = useOxy()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const activeSectionId = pathname.split('/admin/')[1]?.split('/')[0] ?? 'settings'
  const activeSection = ALL_SECTIONS.find((section) => section.id === activeSectionId)

  return (
    <AppShell
      scroll="document"
      navFrom="lg"
      contentMaxWidth={896}
      sidebar={{
        items: PRIMARY_ITEMS,
        secondaryItems: SECONDARY_ITEMS,
        selected: activeSectionId,
        onNavigate: (item) => { if (item.href) navigate(item.href) },
        account: {
          name: user?.username ? `@${user.username}` : 'Admin',
          avatar: { source: user?.avatar ?? undefined, color: 'neutral' },
          onManage: () => openAccountDialog(),
        },
        logo: { wordmark: 'Oxy Admin' },
      }}
      header={<PageHeader title={activeSection?.label ?? 'Admin'} leading={<AppShellMenuButton />} />}
    >
      {children}
    </AppShell>
  )
}
