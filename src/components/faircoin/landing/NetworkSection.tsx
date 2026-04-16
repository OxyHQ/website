import { motion } from 'framer-motion'
import { ArrowUpRight, Compass, Network, Server } from 'lucide-react'

interface Piece {
  icon: typeof Compass
  title: string
  description: string
  href: string
  cta: string
}

const FAIRCOIN_REPO_URL = 'https://github.com/FairCoinOfficial/FairCoin'
const SEEDER_REPO_URL = 'https://github.com/FairCoinOfficial/faircoin-seeder'
const EXPLORER_URL = 'https://explorer.fairco.in'

const PIECES: readonly Piece[] = [
  {
    icon: Compass,
    title: 'Block explorer',
    description:
      'Browse blocks, transactions, addresses and the rich list. Built on the FairCoin Explorer (Next.js + JSON-RPC).',
    href: EXPLORER_URL,
    cta: 'Open the explorer',
  },
  {
    icon: Network,
    title: 'DNS seeders',
    description:
      'seed1.fairco.in and seed2.fairco.in keep the peer list healthy so any wallet can find the network on first launch.',
    href: SEEDER_REPO_URL,
    cta: 'Seeder source',
  },
  {
    icon: Server,
    title: 'Masternodes',
    description:
      'Lock 5,000 FAIR as collateral to run a masternode. Earns a share of block rewards and powers FastSend instant confirmations.',
    href: `${FAIRCOIN_REPO_URL}#masternode-setup`,
    cta: 'How to run one',
  },
]

export default function NetworkSection() {
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
            Open infrastructure
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-5 text-balance text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]"
          >
            Run by the people who use it
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            No corporate gatekeeper. The chain, the explorer, the seeders, the
            wallets — all open, all reproducible, all yours to fork.
          </motion.p>
        </div>

        <div className="mx-auto mt-12 grid gap-4 lg:grid-cols-3">
          {PIECES.map((piece, idx) => (
            <motion.a
              key={piece.title}
              href={piece.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.05 }}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-popover/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <piece.icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-foreground">{piece.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">{piece.description}</p>
              </div>
              <span className="mt-auto pt-2 text-sm font-semibold uppercase tracking-wider text-primary">
                {piece.cta} →
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
