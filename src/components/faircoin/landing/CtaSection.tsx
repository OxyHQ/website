import { Link } from '../../../lib/navigation'
import { motion } from 'framer-motion'
import Button from '../../ui/Button'
import { fc } from '../../../lib/faircoin-links'

const FAIRCOIN_REPO_URL = 'https://github.com/FairCoinOfficial/FairCoin'
const TELEGRAM_URL = 'https://t.me/FairCoin_'

export default function CtaSection() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Diagonal gradient backdrop */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-1/2 h-[600px] -translate-y-1/2 bg-gradient-to-br from-primary/[0.18] via-primary/[0.08] to-transparent" />
        <div className="absolute right-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/[0.18] blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-24 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto flex max-w-2xl flex-col items-center text-center"
        >
          <h2 className="text-balance text-[40px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[56px]">
            <span className="block bg-gradient-to-br from-foreground via-foreground/85 to-primary bg-clip-text text-transparent">
              Pitch in.
            </span>
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Run a masternode. Stake FAIR. File an issue. Translate the wallet.
            Or just use FairCoin and tell someone about it.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button variant="primary" size="lg" href={fc('/buy')}>
              Buy FairCoin
            </Button>
            <Button
              variant="outline"
              size="lg"
              href={`${FAIRCOIN_REPO_URL}#masternode-setup`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Run a masternode
            </Button>
            <Button
              variant="ghost"
              size="lg"
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join the community
            </Button>
          </div>

          <Link
            to={fc('/bridge')}
            className="mt-12 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Looking for the WFAIR bridge? It is here. →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
