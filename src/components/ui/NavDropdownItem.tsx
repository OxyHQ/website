import { Link } from '../../lib/navigation'
import type { NavDropdownItem as NavDropdownItemType } from '../../data/content'
import type { CSSProperties } from 'react'

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

// Inline trusted local SVG source so the artwork keeps inheriting currentColor.
import AiIcon from '../../assets/nav/ai.svg?raw'
import DataIcon from '../../assets/nav/data.svg?raw'
import CollaborationIcon from '../../assets/nav/collaboration.svg?raw'
import AutomationsIcon from '../../assets/nav/automations.svg?raw'
import SequencesIcon from '../../assets/nav/sequences.svg?raw'
import CallIntelligenceIcon from '../../assets/nav/call-intelligence.svg?raw'
import ReportingIcon from '../../assets/nav/reporting.svg?raw'
import DevelopersIcon from '../../assets/nav/developers.svg?raw'
import AppsIcon from '../../assets/nav/apps.svg?raw'
import HelpCenterIcon from '../../assets/nav/help-center.svg?raw'
import AcademyIcon from '../../assets/nav/academy.svg?raw'
import PartnersIcon from '../../assets/nav/partners.svg?raw'
// FairCoin-specific nav icons (sub-brand dropdowns)
import WalletNavIcon from '../../assets/nav/wallet.svg?raw'
import BridgeNavIcon from '../../assets/nav/bridge.svg?raw'
import MasternodeNavIcon from '../../assets/nav/masternode.svg?raw'
import NetworkNavIcon from '../../assets/nav/network.svg?raw'
import ExplorerNavIcon from '../../assets/nav/explorer.svg?raw'
import CoinsNavIcon from '../../assets/nav/coins.svg?raw'
import SwapNavIcon from '../../assets/nav/swap.svg?raw'
import ChartNavIcon from '../../assets/nav/chart.svg?raw'
import ContractNavIcon from '../../assets/nav/contract.svg?raw'
import PoolNavIcon from '../../assets/nav/pool.svg?raw'
import GithubNavIcon from '../../assets/nav/github.svg?raw'
import PackageNavIcon from '../../assets/nav/package.svg?raw'
import ChatNavIcon from '../../assets/nav/chat.svg?raw'
import SendNavIcon from '../../assets/nav/send.svg?raw'
import TwitterNavIcon from '../../assets/nav/twitter.svg?raw'

const iconMap: Record<string, string> = {
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
  /** Hidden measurement panels reserve icon space without fetching artwork. */
  loadImage?: boolean
}

/*
 * `px-space-sm` is the inset the section heading above carries, so the heading's
 * text and the item's mark start on one line. `h-fit`, not `h-full`: an item is
 * as tall as what it holds, and a two-line description next door no longer
 * stretches its neighbours to match.
 */
const linkClass = "group relative flex h-fit w-full items-start gap-space-sm rounded-full px-space-sm py-space-xs transition-colors duration-150 hover:bg-foreground/5 active:bg-foreground/10"

function isExternalItem(item: NavDropdownItemType): boolean {
  return item.external ?? !item.href.startsWith('/')
}

function ExternalLinkMark() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute end-2 top-2 size-3.5 text-muted-foreground"
      viewBox="0 -960 960 960"
      fill="currentColor"
    >
      <path d="M640-624 284-268q-11 11-28 11t-28-11q-11-11-11-28t11-28l356-356H280q-17 0-28.5-11.5T240-720q0-17 11.5-28.5T280-760h400q17 0 28.5 11.5T720-720v400q0 17-11.5 28.5T680-280q-17 0-28.5-11.5T640-320v-304Z" />
    </svg>
  )
}

function ItemIcon({ item, loadImage }: { item: NavDropdownItemType; loadImage: boolean }) {
  const iconSvg = item.icon ? iconMap[item.icon] : null
  const imageUrl = resolveImageUrl(item.image)
  const shouldMaskLogo = Boolean(imageUrl && item.logoColor && isSvgImage(imageUrl) && !item.preserveImageColors)

  if (imageUrl) {
    if (!loadImage) {
      return <span aria-hidden="true" className="size-6 shrink-0" />
    }
    if (shouldMaskLogo) {
      return (
        <span
          aria-hidden="true"
          className="size-6 shrink-0 bg-[var(--nav-logo-color)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
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
        className={`size-6 shrink-0 object-contain ${isSvgImage(imageUrl) ? '' : 'rounded-full'}`}
      />
    )
  }
  if (iconSvg) {
    return (
      <span
        aria-hidden="true"
        className="nav-icon size-6 shrink-0 text-muted-foreground [&_svg]:block [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: iconSvg }}
      />
    )
  }
  // Neither: the initial, so an item with no artwork still has a mark and its
  // title still lines up with the titles above and below it.
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold text-muted-foreground">
      {item.title.charAt(0)}
    </span>
  )
}

function ItemContent({ item, loadImage }: { item: NavDropdownItemType; loadImage: boolean }) {
  return (
    <>
      <ItemIcon item={item} loadImage={loadImage} />

      <span className="flex min-w-0 flex-col gap-space-3xs">
        <span className="text-body-md font-medium text-foreground">{item.title}</span>
        <span className="text-body-xs text-muted-foreground transition-colors duration-150 group-hover:text-foreground/80">
          {item.description}
        </span>
      </span>
      {isExternalItem(item) ? <ExternalLinkMark /> : null}
    </>
  )
}

export default function NavDropdownItem({ item, loadImage = true }: NavDropdownItemProps) {
  const external = isExternalItem(item)
  const className = `${linkClass}${external ? ' pr-7' : ''}`

  if (!external) {
    return (
      <Link to={item.href} className={className}>
        <ItemContent item={item} loadImage={loadImage} />
      </Link>
    )
  }

  return (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
      <ItemContent item={item} loadImage={loadImage} />
    </a>
  )
}
