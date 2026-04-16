import type { ComponentType, SVGProps } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Eye, Cpu } from 'lucide-react'

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

interface TrustPoint {
  icon: IconComponent
  title: string
  description: string
}

const GithubIcon: IconComponent = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
)

const POINTS: readonly TrustPoint[] = [
  {
    icon: GithubIcon,
    title: 'Open source',
    description:
      'Every line is on GitHub. Audit the build, fork it, or compile it yourself. No black boxes.',
  },
  {
    icon: Eye,
    title: 'No telemetry',
    description:
      'Zero analytics. Zero crash reporting. The wallet talks to FairCoin peers and nothing else.',
  },
  {
    icon: ShieldCheck,
    title: 'Standards based',
    description:
      'BIP39 mnemonic, BIP32 HD derivation, BIP44 multi-account paths. Restore on any compatible wallet.',
  },
  {
    icon: Cpu,
    title: 'Community maintained',
    description:
      'No company. No CEO. A handful of volunteers, public roadmap, public issues, public chats.',
  },
]

export default function WalletTrustSection() {
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
            Why this wallet
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-5 text-balance text-[36px] font-semibold leading-tight tracking-tight text-foreground sm:text-[48px]"
          >
            A wallet you can trust
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
            className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            FAIRWallet is built and operated by the FairCoin community on the
            same principles as the chain itself — open, fair, and free of
            speculation.
          </motion.p>
        </div>

        <div className="mx-auto mt-16 grid gap-4 sm:grid-cols-2">
          {POINTS.map((point, idx) => (
            <motion.article
              key={point.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: (idx % 2) * 0.05 }}
              className="flex items-start gap-5 rounded-3xl border border-border bg-popover/60 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/40"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <point.icon className="h-5 w-5" />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-foreground">{point.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {point.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
