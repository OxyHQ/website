import { motion } from 'framer-motion'
import { Apple, Globe, ArrowUpRight, Cpu, Server } from 'lucide-react'
import { fc } from '../../../lib/faircoin-links'

interface WalletOption {
  name: string
  description: string
  badges: readonly string[]
  href: string
  icon: typeof Apple
}

const FAIRCOIN_REPO_URL = 'https://github.com/FairCoinOfficial/FairCoin'
const FAIRWALLET_RELEASES_URL = 'https://github.com/FairCoinOfficial/FAIRWallet/releases'
const FAIRNODE_RELEASES_URL = 'https://github.com/FairCoinOfficial/FAIRNode/releases'

const WALLETS: readonly WalletOption[] = [
  {
    name: 'FAIRWallet',
    description:
      'Lightweight SPV wallet for everyday use. Connects directly to the FairCoin P2P network — no server in the middle.',
    badges: ['iOS', 'Android', 'macOS', 'Windows', 'Linux'],
    href: FAIRWALLET_RELEASES_URL,
    icon: Globe,
  },
  {
    name: 'FAIRNode',
    description:
      'Desktop runner for a full FairCoin Core node. Run a masternode, stake FAIR, and help secure the chain.',
    badges: ['macOS', 'Windows', 'Linux'],
    href: FAIRNODE_RELEASES_URL,
    icon: Cpu,
  },
  {
    name: 'FairCoin Core',
    description:
      'The reference daemon. Build from source for servers, mining rigs, or to participate in protocol development.',
    badges: ['Source', 'CLI'],
    href: FAIRCOIN_REPO_URL,
    icon: Server,
  },
]

export default function WalletsSection() {
  return (
    <section className="relative isolate">
      <div className="container mx-auto px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Wallets
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-5 text-balance text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]"
          >
            Hold your own keys
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            Every flavour, every platform. Hold native FAIR in a non-custodial
            wallet that talks straight to the chain.
          </motion.p>
        </div>

        <div className="mx-auto mt-12 grid gap-4 lg:grid-cols-3">
          {WALLETS.map((wallet, idx) => (
            <motion.a
              key={wallet.name}
              href={wallet.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.05 }}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-popover/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px] hover:shadow-primary/30"
            >
              {/* Hover-only ambient glow */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(circle at top right, hsl(var(--primary)/0.16) 0%, transparent 60%)',
                }}
              />
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <wallet.icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-foreground">{wallet.name}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">{wallet.description}</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                {wallet.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.a>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          No centralised exchanges today. Acquire FAIR via the{' '}
          <a
            href={fc('/buy')}
            className="text-foreground underline-offset-4 hover:underline"
          >
            web buy flow
          </a>
          , by mining the early PoW phase, by staking, or by running a masternode.
        </p>
      </div>
    </section>
  )
}
