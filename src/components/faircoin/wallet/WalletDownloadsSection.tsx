import { motion } from 'framer-motion'
import type { BloomIconComponent } from '@oxy.so/bloom/icons'
import { RiArrowRightUpLine } from '@oxy.so/bloom/icons/RiArrowRightUpLine'
import { RiAndroidFill } from '@oxy.so/bloom/icons/RiAndroidFill'
import { RiAppleFill } from '@oxy.so/bloom/icons/RiAppleFill'
import { RiComputerLine } from '@oxy.so/bloom/icons/RiComputerLine'
import { RiServerLine } from '@oxy.so/bloom/icons/RiServerLine'
import { RiTerminalBoxLine } from '@oxy.so/bloom/icons/RiTerminalBoxLine'

interface DownloadOption {
  platform: string
  description: string
  primaryHref: string
  primaryLabel: string
  icon: BloomIconComponent
}

const RELEASES_URL =
  'https://github.com/FairCoinOfficial/FAIRWallet/releases/latest'

const DOWNLOADS: readonly DownloadOption[] = [
  {
    platform: 'Android',
    description: 'APK from GitHub releases. Play Store listing coming soon.',
    primaryHref: RELEASES_URL,
    primaryLabel: 'Download APK',
    icon: RiAndroidFill,
  },
  {
    platform: 'iOS',
    description: 'TestFlight beta from GitHub releases. App Store listing in review.',
    primaryHref: RELEASES_URL,
    primaryLabel: 'TestFlight invite',
    icon: RiAppleFill,
  },
  {
    platform: 'Windows',
    description: 'Native installer + portable build. Signed releases on every tag.',
    primaryHref: RELEASES_URL,
    primaryLabel: 'Download for Windows',
    icon: RiComputerLine,
  },
  {
    platform: 'macOS',
    description: 'Universal binary, notarized for Apple Silicon and Intel Macs.',
    primaryHref: RELEASES_URL,
    primaryLabel: 'Download for macOS',
    icon: RiAppleFill,
  },
  {
    platform: 'Linux',
    description: 'AppImage + DEB packages. Builds for x86_64 and arm64.',
    primaryHref: RELEASES_URL,
    primaryLabel: 'Download for Linux',
    icon: RiTerminalBoxLine,
  },
  {
    platform: 'Run a node',
    description: 'Want to power the network? FAIRNode runs a full daemon with one click.',
    primaryHref: 'https://github.com/FairCoinOfficial/FAIRNode/releases',
    primaryLabel: 'Get FAIRNode',
    icon: RiServerLine,
  },
]

export default function WalletDownloadsSection() {
  return (
    <section className="relative isolate">
      <div className="container mx-auto px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Downloads
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-5 text-balance text-[36px] font-semibold leading-tight tracking-tight text-foreground sm:text-[48px]"
          >
            Pick your platform
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            Same wallet on every device. Sign in with your seed and your
            balance is right there.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOWNLOADS.map((download, idx) => (
            <motion.a
              key={download.platform}
              href={download.primaryHref}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: (idx % 3) * 0.05 }}
              className="group relative flex flex-col gap-5 overflow-hidden rounded-3xl border border-border bg-popover/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <download.icon width={24} height={24} fill="currentColor" />
                </span>
                <span aria-hidden="true" className="inline-flex text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground">
                  <RiArrowRightUpLine width={16} height={16} fill="currentColor" />
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold text-foreground">{download.platform}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {download.description}
                </p>
              </div>
              <span className="mt-auto pt-2 text-sm font-semibold text-primary">
                {download.primaryLabel} →
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
