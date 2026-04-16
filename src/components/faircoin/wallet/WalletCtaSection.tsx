import { motion } from 'framer-motion'
import Button from '../../ui/Button'

const RELEASES_URL =
  'https://github.com/FairCoinOfficial/FAIRWallet/releases/latest'
const REPO_URL = 'https://github.com/FairCoinOfficial/FAIRWallet'

export default function WalletCtaSection() {
  return (
    <section className="relative isolate overflow-hidden">
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
              Get the wallet.
            </span>
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Install FAIRWallet, write down your seed, and you are on the
            FairCoin network.
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download FAIRWallet
            </Button>
            <Button
              variant="outline"
              size="lg"
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
