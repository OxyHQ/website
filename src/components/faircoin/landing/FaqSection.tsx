import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface FaqItem {
  question: string
  answer: string
}

const FAQS: readonly FaqItem[] = [
  {
    question: 'What is FairCoin?',
    answer:
      'FairCoin is a community-run cryptocurrency forked from Bitcoin in 2014. Hybrid PoW/PoS consensus, Quark hashing, 120-second blocks, capped at 33 million coins. Maintained by volunteers — no ICO, no foundation, no pre-mine beyond the initial 5M coin distribution at block 1.',
  },
  {
    question: 'Where can I buy FAIR?',
    answer:
      'Three paths. (1) Use the web Buy flow on this site to pay with USDC on Base — FAIR arrives in your wallet automatically. (2) If you already hold USDC on Base and use a Web3 wallet, swap it for WFAIR on Uniswap. (3) If you already hold WFAIR or native FAIR, the bridge wraps and unwraps between them. You can also acquire FAIR by staking it, running a masternode, or mining the early PoW phase.',
  },
  {
    question: 'Can I run my own node?',
    answer:
      'Yes. Use FAIRNode for a desktop full-node experience, or build FairCoin Core from source on a server. Running a node strengthens the network and gives you a fully validating wallet.',
  },
  {
    question: 'Is there a wrapped version on Ethereum?',
    answer:
      'Yes — WFAIR on Base. It is live on Base mainnet at 0xF2853C…37fb3. 1:1 wrapped representation for use in Ethereum DeFi, with a live Uniswap v3 pool against USDC. Strictly secondary to native FairCoin and fully redeemable through the bridge.',
  },
  {
    question: 'Where can I follow development?',
    answer:
      'GitHub at FairCoinOfficial. Discussions happen on Discord and Twitter. The full source for the chain, wallets, explorer, seeder and bridge is open on GitHub.',
  },
]

export default function FaqSection() {
  return (
    <section className="relative isolate">
      <div className="container mx-auto max-w-4xl px-4 py-20 sm:py-24">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            FAQ
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-5 text-balance text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[40px]"
          >
            Frequently asked
          </motion.h2>
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-popover/60 backdrop-blur-sm">
          {FAQS.map((faq, idx) => (
            <motion.details
              key={faq.question}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: idx * 0.03 }}
              className={[
                'group',
                idx < FAQS.length - 1 ? 'border-b border-border/60' : '',
              ].join(' ')}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-base font-medium text-foreground transition-colors hover:bg-background/40">
                <span>{faq.question}</span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-open:rotate-45 group-open:border-primary group-open:text-primary">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </summary>
              <div className="px-6 pb-6 text-base leading-relaxed text-muted-foreground">
                {faq.answer}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  )
}
