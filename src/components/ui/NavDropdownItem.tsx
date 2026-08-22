import { Link } from 'react-router-dom'
import type { NavDropdownItem as NavDropdownItemType } from '../../data/content'
import type { ComponentType, CSSProperties, SVGProps } from 'react'

function resolveImageUrl(image: NavDropdownItemType['image']): string {
  if (!image) return ''
  if (typeof image === 'string') {
    return image.startsWith('http') || image.startsWith('/') ? image : ''
  }
  if (image.url) return image.url
  if (image.thumbnails?.lg) return image.thumbnails.lg
  if (image.thumbnails?.md) return image.thumbnails.md
  if (image.thumbnails?.sm) return image.thumbnails.sm
  return ''
}

function isSvgImage(url: string): boolean {
  return url.toLowerCase().split(/[?#]/, 1)[0].endsWith('.svg')
}

// Import all nav icons as React components (inline SVG)
import AiIcon from '../../assets/nav/ai.svg?react'
import DataIcon from '../../assets/nav/data.svg?react'
import CollaborationIcon from '../../assets/nav/collaboration.svg?react'
import AutomationsIcon from '../../assets/nav/automations.svg?react'
import SequencesIcon from '../../assets/nav/sequences.svg?react'
import CallIntelligenceIcon from '../../assets/nav/call-intelligence.svg?react'
import ReportingIcon from '../../assets/nav/reporting.svg?react'
import DevelopersIcon from '../../assets/nav/developers.svg?react'
import AppsIcon from '../../assets/nav/apps.svg?react'
import HelpCenterIcon from '../../assets/nav/help-center.svg?react'
import AcademyIcon from '../../assets/nav/academy.svg?react'
import PartnersIcon from '../../assets/nav/partners.svg?react'
// FairCoin-specific nav icons (sub-brand dropdowns)
import WalletNavIcon from '../../assets/nav/wallet.svg?react'
import BridgeNavIcon from '../../assets/nav/bridge.svg?react'
import MasternodeNavIcon from '../../assets/nav/masternode.svg?react'
import NetworkNavIcon from '../../assets/nav/network.svg?react'
import ExplorerNavIcon from '../../assets/nav/explorer.svg?react'
import CoinsNavIcon from '../../assets/nav/coins.svg?react'
import SwapNavIcon from '../../assets/nav/swap.svg?react'
import ChartNavIcon from '../../assets/nav/chart.svg?react'
import ContractNavIcon from '../../assets/nav/contract.svg?react'
import PoolNavIcon from '../../assets/nav/pool.svg?react'
import GithubNavIcon from '../../assets/nav/github.svg?react'
import PackageNavIcon from '../../assets/nav/package.svg?react'
import ChatNavIcon from '../../assets/nav/chat.svg?react'
import SendNavIcon from '../../assets/nav/send.svg?react'
import TwitterNavIcon from '../../assets/nav/twitter.svg?react'

const iconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  ai: AiIcon,
  data: DataIcon,
  collaboration: CollaborationIcon,
  automations: AutomationsIcon,
  sequences: SequencesIcon,
  'call-intelligence': CallIntelligenceIcon,
  reporting: ReportingIcon,
  developers: DevelopersIcon,
  apps: AppsIcon,
  'help-center': HelpCenterIcon,
  academy: AcademyIcon,
  partners: PartnersIcon,
  wallet: WalletNavIcon,
  bridge: BridgeNavIcon,
  masternode: MasternodeNavIcon,
  network: NetworkNavIcon,
  explorer: ExplorerNavIcon,
  coins: CoinsNavIcon,
  swap: SwapNavIcon,
  chart: ChartNavIcon,
  contract: ContractNavIcon,
  pool: PoolNavIcon,
  github: GithubNavIcon,
  package: PackageNavIcon,
  chat: ChatNavIcon,
  send: SendNavIcon,
  twitter: TwitterNavIcon,
}

interface NavDropdownItemProps {
  item: NavDropdownItemType
}

/*
 * `px-space-sm` is the inset the section heading above carries, so the heading's
 * text and the item's mark start on one line. `h-fit`, not `h-full`: an item is
 * as tall as what it holds, and a two-line description next door no longer
 * stretches its neighbours to match.
 */
const linkClass = "group flex h-fit w-full items-start gap-space-sm rounded-full px-space-sm py-space-xs transition-colors duration-150 hover:bg-foreground/5 active:bg-foreground/10"

function ItemIcon({ item }: { item: NavDropdownItemType }) {
  const IconComponent = item.icon ? iconMap[item.icon] : null
  const imageUrl = resolveImageUrl(item.image)
  const shouldMaskLogo = Boolean(imageUrl && item.logoColor && isSvgImage(imageUrl) && !item.preserveImageColors)

  if (imageUrl) {
    if (shouldMaskLogo) {
      return (
        <span
          aria-hidden="true"
          className="mt-0.5 size-6 shrink-0 bg-[var(--nav-logo-color)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
          style={{
            '--nav-logo-color': item.logoColor,
            maskImage: `url("${imageUrl}")`,
            WebkitMaskImage: `url("${imageUrl}")`,
          } as CSSProperties}
        />
      )
    }
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="mt-0.5 size-6 shrink-0 rounded-full object-contain"
      />
    )
  }
  if (IconComponent) {
    return <IconComponent className="nav-icon mt-0.5 size-6 shrink-0 text-muted-foreground" />
  }
  // Neither: the initial, so an item with no artwork still has a mark and its
  // title still lines up with the titles above and below it.
  return (
    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-muted-foreground">
      {item.title.charAt(0)}
    </span>
  )
}

function ItemContent({ item }: { item: NavDropdownItemType }) {
  return (
    <>
      <ItemIcon item={item} />

      <span className="flex min-w-0 flex-col gap-space-3xs">
        <span className="text-body-md font-medium text-foreground">{item.title}</span>
        <span className="text-body-xs text-muted-foreground transition-colors duration-150 group-hover:text-foreground/80">
          {item.description}
        </span>
      </span>
    </>
  )
}

export default function NavDropdownItem({ item }: NavDropdownItemProps) {
  if (item.href.startsWith('/')) {
    return (
      <Link to={item.href} className={linkClass}>
        <ItemContent item={item} />
      </Link>
    )
  }

  return (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      <ItemContent item={item} />
    </a>
  )
}
