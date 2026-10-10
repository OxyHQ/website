import { motion } from 'framer-motion';
import { FaqList } from '../../sections/FaqSection';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: readonly FaqItem[] = [
  {
    question: 'What is FairCoin?',
    answer:
      'FairCoin is a community-run cryptocurrency forked from Bitcoin in 2014. Hybrid PoW/PoS consensus, Quark hashing, 120-second blocks, capped at 33 million coins. Maintained by volunteers. No ICO, no foundation, no pre-mine beyond the initial 5M coin distribution at block 1.',
  },
  {
    question: 'Where can I buy FAIR?',
    answer:
      'Three paths. (1) Use the web Buy flow on this site to pay with USDC on Base, and FAIR arrives in your wallet automatically. (2) If you already hold USDC on Base and use a Web3 wallet, swap it for WFAIR on Uniswap. (3) If you already hold WFAIR or native FAIR, the bridge wraps and unwraps between them. You can also acquire FAIR by staking it, running a masternode, or mining the early PoW phase.',
  },
  {
    question: 'Can I run my own node?',
    answer:
      'Yes. Use FAIRNode for a desktop full-node experience, or build FairCoin Core from source on a server. Running a node strengthens the network and gives you a fully validating wallet.',
  },
  {
    question: 'Is there a wrapped version on Ethereum?',
    answer:
      'Yes, WFAIR on Base. It is live on Base mainnet at 0xF2853C…37fb3. 1:1 wrapped representation for use in Ethereum DeFi, with a live Uniswap v3 pool against USDC. Strictly secondary to native FairCoin and fully redeemable through the bridge.',
  },
  {
    question: 'Where can I follow development?',
    answer:
      'GitHub at FairCoinOfficial. Discussions happen on Discord and Twitter. The full source for the chain, wallets, explorer, seeder and bridge is open on GitHub.',
  },
];

const FAQ_ROW_STYLE = { paddingLeft: 24, paddingRight: 24 };

export default function FaqSection() {
  return (
    <section className="relative isolate">
      <div className="mx-auto w-full max-w-4xl px-[var(--layout-gutter)] py-20 sm:py-24">
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mt-12 overflow-hidden rounded-3xl border border-border bg-popover/60 backdrop-blur-sm"
        >
          <FaqList
            items={FAQS}
            idPrefix="faircoin-faq"
            questionClassName="text-base font-medium text-foreground"
            answerClassName="pb-6 text-base leading-relaxed text-muted-foreground"
            itemStyle={FAQ_ROW_STYLE}
          />
        </motion.div>
      </div>
    </section>
  );
}
