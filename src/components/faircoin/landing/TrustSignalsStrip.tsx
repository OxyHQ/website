import { motion } from 'framer-motion'

interface TrustSignal {
  label: string
  href: string
  icon: React.ReactNode
}

/**
 * Inline-SVG trust signals strip. Uses real brand glyphs (Base, Uniswap,
 * Etherscan-style logos, GitHub) so the page reads as professional fintech
 * rather than a generic crypto landing.
 *
 * SVG paths are simplified inline copies of the official brand marks so we
 * have no external image dependency and can recolor with `currentColor`.
 */
const SIGNALS: readonly TrustSignal[] = [
  {
    label: 'Built on Base',
    href: 'https://base.org',
    icon: <BaseLogo />,
  },
  {
    label: 'Powered by Uniswap',
    href: 'https://app.uniswap.org/explore/tokens/base/0xf2853ceddf47a05fee0b4b24dff2925d59737fb3',
    icon: <UniswapLogo />,
  },
  {
    label: 'Verified on Basescan',
    href: 'https://basescan.org/address/0xF2853CedDF47A05Fee0B4b24DFf2925d59737fb3',
    icon: <BasescanLogo />,
  },
  {
    label: 'Open source',
    href: 'https://github.com/FairCoinOfficial',
    icon: <GithubLogo />,
  },
]

export default function TrustSignalsStrip() {
  return (
    <section className="relative isolate">
      <div className="container mx-auto px-4 pb-2 pt-12">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        >
          Built on open infrastructure
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
          className="mx-auto mt-6 grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-4 sm:gap-x-6"
        >
          {SIGNALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2.5 rounded-2xl border border-border/60 bg-background/40 px-4 py-3 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-background/80"
            >
              <span className="flex h-5 w-5 items-center justify-center text-foreground/80 transition-colors group-hover:text-foreground">
                {s.icon}
              </span>
              <span className="text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                {s.label}
              </span>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function BaseLogo() {
  return (
    <svg viewBox="0 0 111 111" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <path
        d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 21.8704 0 49.6916H72.8467V60.3274H0C2.35281 88.1485 26.0432 110.034 54.921 110.034Z"
        fill="#0052FF"
      />
    </svg>
  )
}

function UniswapLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <path
        d="M7.21 6.836c-.165-.025-.171-.028-.094-.04.149-.022.498.009.74.066.563.131 1.075.471 1.62 1.075l.146.16.207-.033c.872-.139 1.762-.029 2.504.314.205.094.527.281.567.328.013.015.036.114.052.22.054.366.026.643-.085.853-.062.114-.063.149-.022.245.034.077.124.135.213.135.184 0 .38-.295.473-.706l.034-.164.066.075c.366.41.654.97.7 1.366l.013.103-.061-.094a1.473 1.473 0 0 0-.342-.376c-.292-.195-.595-.262-1.394-.301-.722-.038-1.13-.099-1.534-.231-.687-.224-1.034-.522-1.85-1.587-.36-.471-.586-.733-.808-.943-.508-.486-1.005-.74-1.645-.83Z"
        fill="#FF007A"
      />
      <path
        d="M11.96 12.736c-.224-.045-.295-.078-.379-.18-.034-.04-.214-.282-.4-.535-.39-.532-.486-.628-.717-.713-.122-.045-.273-.057-.378-.027-.262.075-.378.286-.342.62.04.357.225.605.485.65.197.034.39-.103.39-.276 0-.173-.06-.225-.225-.296-.131-.058-.158-.063-.158-.043 0 .037.103.13.18.156.122.041.157.084.157.2 0 .087-.006.105-.058.156a.234.234 0 0 1-.231.063c-.18-.04-.282-.207-.282-.461 0-.225.05-.37.18-.51.198-.207.498-.214.74-.014.105.087.275.317.275.376 0 .024.067.124.149.224.171.207.225.276.245.32.133.276.064.661-.155.85-.045.04-.13.106-.187.149-.205.146-.328.27-.44.443a1.93 1.93 0 0 0-.275.808.972.972 0 0 1-.06.249c-.01-.013-.03-.158-.034-.296-.018-.59.135-1.03.498-1.422.265-.288.526-.435 1.071-.604.318-.099.41-.158.547-.353.115-.165.16-.32.166-.595.005-.182 0-.225-.04-.336-.063-.176-.224-.395-.45-.61-.272-.26-.502-.421-.693-.486-.151-.052-.401-.053-.594-.001-.144.038-.318.099-.398.129-.215.082-.376.087-.563.018-.122-.045-.39-.184-.495-.255l-.063-.043.075-.105c.108-.151.32-.297.498-.34.13-.034.413-.04.55-.014.376.077.692.354 1.105.97.177.262.21.301.37.514.255.341.367.43.557.532.288.157.583.214.945.214l.213-.001v.045c0 .045-.005.087-.014.124a4.123 4.123 0 0 1-.45.078Z"
        fill="#FF007A"
      />
    </svg>
  )
}

function BasescanLogo() {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 13L16 9L23 13L23 19L16 23L9 19L9 13Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
  )
}

function GithubLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}
