import { Badge } from '@oxy.so/bloom/badge'
import { Button } from '@oxy.so/bloom/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@oxy.so/bloom/dropdown-menu'
import { RiArrowDownSLine } from '@oxy.so/bloom/icons/RiArrowDownSLine'
import { useNavigate } from '../../lib/navigation'
import { useTranslation } from '../../lib/i18n'
import type { SyncedPackage } from '../../../scripts/types'
import { buildDocsHref } from '../../content/docs-loader'

interface VersionSelectorProps {
  pkg: SyncedPackage
  currentVersion: string
  /** Slug within the current package — preserved when switching versions. */
  slug?: string
}

/**
 * Version dropdown shown in the docs header. Only renders for packages
 * that ship versioned docs (`versioned: true` in their `docs.config.json`)
 * with more than one entry in `versions[]`. Non-versioned packages —
 * end-user apps like Accounts / Console / Inbox — have no need for a
 * version selector and we skip rendering entirely.
 */
export default function VersionSelector({ pkg, currentVersion, slug }: VersionSelectorProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (!pkg.versioned || pkg.versions.length <= 1) return null

  const latestBadge = <Badge content={t('docs.versionLatest')} color="primary" variant="subtle" />
  const label = t('docs.switchVersion', { version: currentVersion })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild label={label} className="inline-flex">
        <Button
          size="xs"
          appearance="subtle"
          tone="neutral"
          accessibilityLabel={label}
          trailing={currentVersion === pkg.latestVersion ? latestBadge : undefined}
          trailingIcon={RiArrowDownSLine}
        >
          {`v${currentVersion}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={currentVersion}
          onValueChange={(version) => navigate(buildDocsHref(pkg, version, slug))}
        >
          {pkg.versions.map((v) => (
            <DropdownMenuRadioItem
              key={v.version}
              value={v.version}
              accessibilityLabel={`v${v.version}`}
              trailing={
                v.version === pkg.latestVersion ? (
                  latestBadge
                ) : pkg.deprecatedVersions.includes(v.version) ? (
                  <Badge content={t('docs.versionDeprecated')} color="error" variant="subtle" />
                ) : undefined
              }
            >
              {`v${v.version}`}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
