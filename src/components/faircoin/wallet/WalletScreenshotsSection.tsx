import { motion } from 'framer-motion'
import PhoneMockup from '../landing/PhoneMockup'

interface ScreenLabel {
  title: string
  description: string
}

const SCREENS: readonly ScreenLabel[] = [
  {
    title: 'Home',
    description:
      'Hero image, balance in FAIR + USD, sync status pill, action buttons row, recent activity.',
  },
  {
    title: 'Send',
    description:
      'Paste an address or scan a QR. Confirm with Face ID. Transaction broadcast in seconds.',
  },
  {
    title: 'Receive',
    description:
      'Big QR code. Tap-to-share payment requests. Optional amount in FAIR or USD.',
  },
  {
    title: 'Activity',
    description:
      'Filterable transaction history. Tap any item to see fees, confirmations, and the explorer link.',
  },
]

/**
 * Screenshots gallery — uses the PhoneMockup three times to keep the page
 * coherent before we ship a full multi-screen capture set. The descriptions
 * walk users through what each screen does.
 */
export default function WalletScreenshotsSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-1/4 h-[600px] bg-gradient-to-b from-primary/[0.06] via-primary/[0.02] to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-20 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Screens
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-5 text-balance text-[36px] font-semibold leading-tight tracking-tight text-foreground sm:text-[48px]"
          >
            See the wallet in motion
          </motion.h2>
        </div>

        <div className="mx-auto mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {SCREENS.map((screen, idx) => (
            <motion.div
              key={screen.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: (idx % 2) * 0.1 }}
              className={`flex flex-col items-center gap-8 lg:gap-12 ${
                idx % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
              }`}
            >
              <div className="w-full max-w-[280px] shrink-0">
                <PhoneMockup />
              </div>
              <div className="flex flex-col gap-3 text-center lg:text-left">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {screen.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {screen.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
