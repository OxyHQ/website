import { motion } from 'framer-motion'
import {
  KeyRound,
  Wifi,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  BookUser,
  Zap,
  MapPin,
} from 'lucide-react'

interface Feature {
  icon: typeof KeyRound
  title: string
  description: string
}

const FEATURES: readonly Feature[] = [
  {
    icon: KeyRound,
    title: 'Self-custody',
    description:
      'You own your seed. The wallet generates and stores keys on-device. No accounts, no recovery emails, no server can lock you out.',
  },
  {
    icon: Wifi,
    title: 'SPV — no servers',
    description:
      'Talks straight to the FairCoin P2P network. No middlemen, no APIs, no tracking. Your phone is the wallet.',
  },
  {
    icon: Smartphone,
    title: 'Every platform',
    description:
      'Android, iOS, Windows, macOS and Linux. Same wallet, same seed, same balance everywhere you sign in.',
  },
  {
    icon: CreditCard,
    title: 'Buy in-app',
    description:
      'Pay with USDC on Base from the buy screen. The bridge converts and delivers FAIR straight to your address.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Send & receive',
    description:
      'QR codes, paste an address, scan a payment request. Receive FAIR with one tap and a deep-link.',
  },
  {
    icon: BookUser,
    title: 'Address book',
    description:
      'Save your regulars as contacts. Pay them by name, not by hex string. Synced encrypted via your seed.',
  },
  {
    icon: Zap,
    title: 'FastSend',
    description:
      'Masternode-powered instant confirmations. Coffee-shop friendly — confirmations in seconds, not minutes.',
  },
  {
    icon: MapPin,
    title: 'Places',
    description:
      'Discover merchants accepting FAIR near you. Community-curated map, pinned to your location.',
  },
]

export default function WalletFeaturesSection() {
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
            What you get
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-5 text-balance text-[36px] font-semibold leading-tight tracking-tight text-foreground sm:text-[48px]"
          >
            Built for daily use
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            Eight years of FAIRWallet refinement, distilled into a wallet you
            can hand to your aunt without explanation.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, idx) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: (idx % 4) * 0.05 }}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-popover/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
