import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RiArrowUpLine } from '@oxy.so/bloom/icons/RiArrowUpLine';
import { RiQrCodeLine } from '@oxy.so/bloom/icons/RiQrCodeLine';
import { RiShieldCheckLine } from '@oxy.so/bloom/icons/RiShieldCheckLine';
import { RiWallet3Line } from '@oxy.so/bloom/icons/RiWallet3Line';
import { fc } from '../../../lib/faircoin-links';
import { Link } from '../../../lib/navigation';
import Button from '../cash/FairCoinButton';
import ExplorerStats from '../cash/ExplorerStats';
import WalletScenes, { type WalletScene } from './WalletScenes';
import '../cash/fonts.css';
import { useWalletReducedMotion } from './useWalletReducedMotion';

const DOWNLOAD = 'https://github.com/FairCoinOfficial/FAIRWallet/releases/latest';
const GUTTER = 'px-[5px] lg:px-5';
const INNER = 'mx-auto w-full lg:w-[74.86%]';
const HEADING =
  'text-[calc(var(--wallet-type)*2)] leading-[1.1] tracking-[-.02em] lg:text-[calc(var(--wallet-type)*2.43)]';
const FEATURES: { title: string; copy: string; scene: WalletScene }[] = [
  {
    title: 'DIRECT PAYMENTS',
    copy: 'Send FairCoin directly to another wallet. Review the details, then send.',
    scene: 'send',
  },
  {
    title: 'ACTIVITY TRACKING',
    copy: 'Keep track of exactly how much FairCoin you have sent and received, all in one place.',
    scene: 'activity',
  },
  {
    title: 'RECEIVE WITH FAIRWALLET',
    copy: 'Share your wallet address or QR code to receive FairCoin from friends and family.',
    scene: 'receive',
  },
  {
    title: 'POCKETS',
    copy: 'Keep your everyday money and future plans in their own pockets, inside your wallet.',
    scene: 'pockets',
  },
  {
    title: 'SECURITY LOCK',
    copy: 'Protect your wallet with a PIN and enable biometric unlock on supported devices.',
    scene: 'lock',
  },
];
const FAQS = [
  [
    'How do I send FairCoin with FAIRWallet?',
    'Open your wallet and choose Send. Enter the recipient’s FairCoin address or scan their QR code, choose the amount, then review the address and network fee before confirming.',
  ],
  [
    'How much FairCoin can I send?',
    'You can send up to your available, spendable balance, leaving enough to cover the network fee. Pending transactions and funds committed to staking may affect the amount available to send.',
  ],
  [
    'Do I need a balance before I can send FairCoin?',
    'Yes. Your wallet needs enough native FAIR to cover both the amount you want to send and the network fee. You can receive FAIR at your wallet address first.',
  ],
  [
    'Is there a fee to send FairCoin?',
    'A network fee applies to on-chain transactions. Review the fee shown by FAIRWallet before confirming your payment.',
  ],
  [
    'Where can I download FAIRWallet?',
    'Get the latest release using the download button on this page. Android, macOS, Windows and Linux packages are available on GitHub. Check the release notes for the supported version and architecture.',
  ],
  [
    'Can I send FairCoin to someone who doesn’t use FAIRWallet?',
    'Yes, if they have a compatible native FairCoin wallet. Ask for their FairCoin mainnet address. Wrapped FAIR on Base uses a different network and must not be sent directly to a native FairCoin address.',
  ],
  [
    'How does FAIRWallet protect my wallet?',
    'FAIRWallet is a self-custody wallet: you control your keys. Use a strong PIN, enable biometrics where supported, and keep your recovery phrase private and safely backed up offline. Anyone with that phrase can access your coins.',
  ],
];

function WalletFaq() {
  const [open, setOpen] = useState<number | null>(null);
  const id = useId();
  const reduce = useWalletReducedMotion();
  return (
    <section
      id="wallet-questions"
      className={`${GUTTER} scroll-mt-24 py-[58px] lg:py-[100px]`}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className={`${HEADING} mb-6 lg:mb-8`}>
        Common questions
      </h2>
      <div className="border-t border-border">
        {FAQS.map(([question, answer], index) => (
          <div key={question} className="border-b border-border">
            <h3>
              <button
                type="button"
                id={`${id}-q-${index}`}
                aria-expanded={open === index}
                aria-controls={`${id}-a-${index}`}
                onClick={() => setOpen(open === index ? null : index)}
                className="flex min-h-[78px] w-full items-center justify-between gap-6 py-5 lg:py-[18px] text-left text-[calc(var(--wallet-type)*1.57143)] leading-[1.1] tracking-[-.02em] text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring lg:text-[calc(var(--wallet-type)*1.9)]"
              >
                {question}
                <span
                  aria-hidden="true"
                  className={`relative size-8 shrink-0 text-foreground transition-transform motion-reduce:transition-none lg:size-10 ${open === index ? 'rotate-45' : ''}`}
                >
                  <span className="absolute inset-y-[8%] left-1/2 w-[1.5px] bg-current" />
                  <span className="absolute inset-x-[8%] top-1/2 h-[1.5px] bg-current" />
                </span>
              </button>
            </h3>
            <section id={`${id}-a-${index}`} aria-labelledby={`${id}-q-${index}`}>
              <AnimatePresence initial={false}>
                {open === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[850px] pb-7 pr-10 text-[calc(var(--wallet-type)*1)] leading-[1.4]">
                      {answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Same gallery grid, media ratios, mobile stagger and section rhythm as /send. */
export default function WalletLandingContent({
  onToneChange,
}: {
  onToneChange: (dark: boolean) => void;
}) {
  const finalSection = useRef<HTMLElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = finalSection.current?.getBoundingClientRect();
        onToneChange(!!rect && rect.top <= 80 && rect.bottom > 80);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [onToneChange]);
  return (
    <div
      data-wallet-landing
      className="faircoin-editorial mx-auto max-w-[2600px] bg-card [&_.bloom-btn]:!bg-none [&_.bloom-btn::after]:!bg-none [&_.bloom-btn::after]:!shadow-none pt-[96px] lg:pt-[86px] text-foreground [font-family:'FairCoin_Editorial',sans-serif] [--wallet-type:clamp(12px,3.59vw,20px)] lg:[--wallet-type:clamp(14px,calc(-1.31714px+1.46246vw),36.7069px)]"
    >
      <section className={GUTTER} aria-labelledby="wallet-title">
        <h1
          id="wallet-title"
          className="mb-3 text-[calc(var(--wallet-type)*2.57143)] leading-[.95] tracking-[-.03em] lg:mb-9 lg:text-[calc(var(--wallet-type)*3.25)]"
        >
          Send FairCoin with
          <br />
          FAIRWallet
        </h1>
        <img
          src="/faircoin/wallet/send-hero.webp"
          alt="FAIRWallet on a titanium phone with a green motion trail"
          fetchPriority="high"
          width={1774}
          height={887}
          className="h-[500px] w-full rounded-[12px] object-cover object-[72%_center] lg:h-auto lg:aspect-[2.047] lg:rounded-[20px] lg:object-center"
        />
        <p className="mt-2 max-w-[700px] lg:min-h-[70px] text-[calc(var(--wallet-type)*.85)] leading-[1.2] tracking-[-.02em] text-muted-foreground lg:text-[calc(var(--wallet-type)*.75)]">
          FAIRWallet is a self-custody wallet for FairCoin. Network fees apply to on-chain payments.
          App screens and balances shown are illustrative. Download the latest release for Android,
          macOS, Windows or Linux.
        </p>
      </section>
      <div className={GUTTER}>
        <section
          className={`${INNER} py-[58px] lg:pb-[100px] lg:pt-9`}
          aria-labelledby="wallet-quick-hits"
        >
          <h2 id="wallet-quick-hits" className={`${HEADING} mb-6 text-balance`}>
            Send and receive FairCoin with family and friends
          </h2>
          <div className="grid gap-[calc(17.1429px+2.14286vw)] rounded-[12px] border border-border px-[calc(16px+1.25vw)] py-[calc(5.71429px+4.46429vw)] min-[600px]:grid-cols-2 lg:rounded-[20px]">
            {[
              {
                icon: RiArrowUpLine,
                text: 'Enter a FairCoin address to send directly to another wallet',
              },
              { icon: RiQrCodeLine, text: 'Share your QR code to receive from friends and family' },
              {
                icon: RiShieldCheckLine,
                text: 'Review the amount, address and network fee before you send',
              },
              {
                icon: RiWallet3Line,
                text: 'Keep your coins in your own wallet, with your own keys',
              },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 lg:gap-5">
                <Icon
                  fill="currentColor"
                  className="faircoin-editorial-green mt-1 size-5 shrink-0 text-ring lg:size-10"
                />
                <p className="text-[length:var(--wallet-type)] leading-[1.4]">{text}</p>
              </div>
            ))}
          </div>
        </section>
        <div className={`${INNER} space-y-[58px] lg:space-y-[50px]`}>
          {FEATURES.map(({ title, copy, scene }, i) => (
            <section
              key={scene}
              data-wallet-feature={scene}
              className={`grid w-[79.5%] items-center gap-y-6 lg:w-full lg:gap-x-[6.6%] ${i % 2 === 0 ? 'ml-auto lg:grid-cols-[1fr_1.8fr]' : 'mr-auto lg:grid-cols-[60%_1fr] lg:gap-x-[7.3%]'}`}
            >
              <div className={i % 2 ? 'lg:col-start-2 lg:row-start-1' : ''}>
                <h2 className="mb-2 text-[length:var(--wallet-type)] leading-[1.2] text-muted-foreground lg:mb-4 lg:text-[calc(var(--wallet-type)*.75)]">
                  {title}
                </h2>
                <p className="text-[calc(var(--wallet-type)*1.28571)] leading-[1.1] tracking-[-.02em]">
                  {copy}
                </p>
              </div>
              <div className={i % 2 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                <WalletScenes scene={scene} />
              </div>
            </section>
          ))}
        </div>
      </div>
      <section
        id="wallet-security"
        className={`${GUTTER} mt-[58px] scroll-mt-24 bg-background py-[28px] lg:mt-[100px] lg:py-20`}
        aria-labelledby="wallet-security-title"
      >
        <div className="grid gap-[10px] lg:grid-cols-4">
          <div>
            <h2
              id="wallet-security-title"
              className="text-[calc(var(--wallet-type)*1.57143)] leading-[1.1] tracking-[-.02em] lg:max-w-[290px] lg:text-[calc(var(--wallet-type)*2.43)]"
            >
              FAIRWallet is
              <br className="hidden lg:block" /> built for
              <br className="hidden lg:block" /> security
            </h2>
            <Button
              href="#wallet-questions"
              className="hidden lg:mt-6 lg:inline-flex lg:!min-h-[70px] lg:!px-7 lg:!text-base"
            >
              Learn about security
            </Button>
            <a href="#wallet-questions" className="mt-2 mb-2 block text-sm font-semibold lg:hidden">
              Learn about security →
            </a>
          </div>
          {[
            { scene: 'review' as const, label: 'Review every payment' },
            { scene: 'recovery' as const, label: 'Your keys stay with you' },
            { scene: 'unlock' as const, label: 'PIN and biometric unlock' },
          ].map(({ scene, label }) => (
            <div key={scene} className="grid grid-cols-[40%_1fr] items-start gap-2 lg:block">
              <WalletScenes scene={scene} square />
              <h3 className="text-[calc(var(--wallet-type)*1.28571)] leading-[1.1] tracking-[-.02em] lg:mt-4">
                {label}
              </h3>
            </div>
          ))}
        </div>
      </section>
      <WalletFaq />
      <section
        className={`${GUTTER} bg-background py-[30px] lg:py-20`}
        aria-labelledby="wallet-explore-title"
      >
        <div className={INNER}>
          <h2
            id="wallet-explore-title"
            className="mb-4 text-[calc(var(--wallet-type)*1.57143)] leading-[1.1] tracking-[-.02em] lg:mb-6 lg:text-[calc(var(--wallet-type)*2.43)]"
          >
            Explore more
          </h2>
          <div className="grid gap-[10px] lg:grid-cols-3">
            {[
              {
                href: fc('/'),
                label: 'Ethical money for everyday life',
                cta: 'Explore FairCoin',
                art: 'wallet',
              },
              {
                href: fc('/buy/'),
                label: 'Get FairCoin for your next payment',
                cta: 'Get FairCoin',
                art: 'coin',
              },
              {
                href: fc('/bridge/'),
                label: 'Move between FairCoin and Base',
                cta: 'Explore the bridge',
                art: 'bridge',
              },
            ].map(({ href, label, cta, art }) => (
              <div key={art} className="grid grid-cols-[40%_1fr] items-start gap-x-2 lg:block">
                <div className="faircoin-editorial-dark relative block row-span-2 aspect-square overflow-hidden rounded-[12px] bg-primary-foreground text-foreground lg:rounded-[20px]">
                  {art === 'coin' ? (
                    <div className="faircoin-editorial-green absolute inset-[28%] bg-ring [mask-image:url('/images/apps/faircoin.svg')] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]" />
                  ) : (
                    <WalletScenes scene={art === 'wallet' ? 'balance' : 'bridge'} square />
                  )}
                </div>
                <h3 className="text-[calc(var(--wallet-type)*1.28571)] leading-[1.1] tracking-[-.02em] lg:mb-6 lg:mt-4 lg:max-w-[85%]">
                  {label}
                </h3>
                <Button
                  href={href}
                  className="hidden lg:inline-flex lg:mt-0 lg:!min-h-[70px] lg:!px-7 lg:!text-base"
                >
                  {cta}
                </Button>
                <Link to={href} className="mt-1 self-start text-sm font-semibold lg:hidden">
                  {cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        ref={finalSection}
        id="wallet-download"
        className={`faircoin-editorial-dark ${GUTTER} bg-primary-foreground pb-20 pt-[100px] text-foreground lg:pt-[180px]`}
      >
        <h2 className="mb-[100px] text-[calc(var(--wallet-type)*2.57143)] leading-[.95] tracking-[-.03em] lg:mb-[200px] lg:text-[calc(var(--wallet-type)*2.75)]">
          FairCoin makes
          <br />
          money meaningful.
        </h2>
        <ExplorerStats ctaHref={DOWNLOAD} ctaLabel="Get FAIRWallet" />
      </section>
      <div className="faircoin-editorial fixed inset-x-0 bottom-0 z-30 flex justify-center bg-card px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-6 lg:hidden">
        <span className="rounded-full bg-primary text-primary-foreground [&_a]:!min-h-10">
          <Button href={DOWNLOAD} className="!border-transparent !px-7">
            Download FAIRWallet
          </Button>
        </span>
      </div>
    </div>
  );
}
