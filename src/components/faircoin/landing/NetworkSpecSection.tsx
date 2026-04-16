import { motion } from 'framer-motion'

interface NetworkParam {
  label: string
  value: string
  hint?: string
}

const NETWORK_PARAMS: readonly NetworkParam[] = [
  { label: 'Ticker', value: 'FAIR' },
  { label: 'Algorithm', value: 'Quark', hint: 'PoW + PoS hybrid' },
  { label: 'Block time', value: '120 seconds' },
  { label: 'Max supply', value: '33,000,000 FAIR' },
  { label: 'Premine', value: '5,000,000 FAIR', hint: 'Block 1 distribution' },
  { label: 'Masternode collateral', value: '5,000 FAIR' },
  { label: 'BIP44 coin type', value: '119' },
  { label: 'P2P port', value: '46372' },
]

/**
 * Apple-style spec sheet for the FairCoin network parameters. Numbers right-
 * aligned, typography deliberately monospaced, subtle alternating row tint
 * for legibility.
 */
export default function NetworkSpecSection() {
  return (
    <section className="relative isolate">
      <div className="container mx-auto px-4 py-20 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              The chain
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mt-5 text-balance text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]"
            >
              A working chain, kept simple
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
              className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
            >
              FairCoin is a Bitcoin-fork cryptocurrency launched in 2014. It
              pairs proof-of-work with proof-of-stake, runs the Quark hash
              function, settles new blocks every two minutes, and has a hard
              supply cap of 33 million coins.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="mt-3 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
            >
              Maintained by volunteers. No ICO, no foundation, no marketing
              budget — just a daemon, a few wallets, an explorer and a small
              group of people that keep shipping.
            </motion.p>
          </div>

          {/* Spec sheet */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="overflow-hidden rounded-3xl border border-border bg-popover/60 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.18)] backdrop-blur-sm"
          >
            <div className="flex items-center justify-between border-b border-border bg-background/50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span>FairCoin Core specification</span>
              <span className="font-mono">v3 · mainnet</span>
            </div>
            <dl>
              {NETWORK_PARAMS.map((param, idx) => (
                <div
                  key={param.label}
                  className={[
                    'grid grid-cols-2 items-baseline gap-4 px-5 py-3.5 transition-colors hover:bg-background/40',
                    idx < NETWORK_PARAMS.length - 1 ? 'border-b border-border/60' : '',
                  ].join(' ')}
                >
                  <dt className="text-base font-medium text-muted-foreground">{param.label}</dt>
                  <dd className="text-right">
                    <span className="font-mono text-base font-semibold text-foreground">
                      {param.value}
                    </span>
                    {param.hint ? (
                      <span className="ml-2 text-sm text-muted-foreground">{param.hint}</span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
