import { motion } from 'framer-motion'
import Button from '../../ui/Button'
import PhoneMockup from '../landing/PhoneMockup'

const ANDROID_RELEASES_URL =
  'https://github.com/FairCoinOfficial/FAIRWallet/releases/latest'
const IOS_TESTFLIGHT_URL =
  'https://github.com/FairCoinOfficial/FAIRWallet/releases/latest'

const HERO_FEATURES = [
  { label: 'Self-custody' },
  { label: 'No account' },
  { label: 'Open source' },
] as const

/**
 * `/wallet` hero — marketing intro for FAIRWallet.
 *
 * Two-column layout matching the main FairCoin landing hero so the pages feel
 * coherent. Phone mockup on the right (the same 1:1 FAIRWallet replica used
 * on /), big confident headline on the left, two icon-free CTA buttons, and
 * a small trust line under them.
 */
export default function WalletHeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Ambient gradient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[900px] bg-gradient-to-b from-primary/[0.12] via-primary/[0.04] to-transparent" />
        <div className="absolute right-[-10%] top-32 h-[680px] w-[680px] rounded-full bg-primary/[0.08] blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pb-12 pt-16 sm:pb-20 sm:pt-24 lg:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          <div className="text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
            >
              FAIRWallet
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
              className="mt-6 text-balance text-[44px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[60px] lg:text-[72px]"
            >
              <span className="block bg-gradient-to-br from-foreground via-foreground/85 to-primary bg-clip-text text-transparent">
                Your FairCoin wallet.
              </span>
              <span className="block">In your pocket.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
              className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted-foreground sm:text-xl lg:mx-0"
            >
              Send, receive, stake and explore the FairCoin network from one
              non-custodial app. Built by the community, free forever.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start"
            >
              <Button
                variant="primary"
                size="lg"
                href={ANDROID_RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download for Android
              </Button>
              <Button
                variant="outline"
                size="lg"
                href={IOS_TESTFLIGHT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download for iOS
              </Button>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground lg:justify-start"
            >
              {HERO_FEATURES.map((feature) => (
                <li key={feature.label} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {feature.label}
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="relative lg:pl-12">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
