import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import Button from './FairCoinButton';
import { fc } from '../../../lib/faircoin-links';
import { Link } from '../../../lib/navigation';
import LandingPhone from './LandingPhone';
import ExplorerStats from './ExplorerStats';
import { useLandingMotion } from './useLandingMotion';
import './fonts.css';

// The reference caps its twelve content columns at 1440px; backgrounds stay full width.
const GUTTER = 'px-4 lg:px-[max(20px,calc((100%_-_1440px)/2))]';
const TITLE =
  'text-balance text-[length:calc(var(--landing-type)*1.75)] font-normal leading-[1.1] tracking-[-.03em] min-[760px]:text-[length:calc(var(--landing-type)*2)] lg:text-[length:calc(var(--landing-type)*2.5)]';
const HERO_TITLE =
  'text-[length:calc(var(--landing-type)*2.5)] leading-[.95] tracking-[-.03em] min-[760px]:text-[length:calc(var(--landing-type)*3.25)] lg:text-[length:calc(var(--landing-type)*3.5)]';
const COPY =
  'text-[length:var(--landing-type)] leading-[1.4] tracking-[-.025em] min-[760px]:text-[length:calc(var(--landing-type)*1.125)]';

/** The reference's 12-column composition: 3 columns copy, 4 media, 3 copy.
 * Each desktop chapter occupies one viewport. Mobile places the media first.
 */
function Stage({
  id,
  title,
  children,
  visual,
  dark = false,
  free = false,
  exit = 'fade',
  paused,
  toggle,
}: {
  id: string;
  title: string;
  children: ReactNode;
  visual: ReactNode | ((paused: boolean) => ReactNode);
  dark?: boolean;
  free?: boolean;
  exit?: 'wipe' | 'fade';
  paused: boolean;
  toggle: () => void;
}) {
  const section = useRef<HTMLElement>(null);
  // A fixed phone stays geometrically in view even when its mask is hidden.
  // Playback must follow its chapter, not the phone's viewport coordinates.
  const inView = useInView(section, { amount: 0.75 });
  const content = typeof visual === 'function' ? visual(paused || !inView) : visual;
  return (
    <section
      ref={section}
      id={id}
      data-phone-stage
      data-phone-exit={exit}
      data-section-tone={dark ? 'dark' : 'light'}
      className={`${dark ? 'faircoin-editorial-dark bg-primary-foreground' : 'faircoin-editorial bg-card'} ${GUTTER} relative py-[60px] text-foreground lg:h-svh lg:min-h-[600px] lg:py-[10svh]`}
    >
      <div className="grid items-center gap-x-5 lg:mx-0.5 lg:h-full lg:grid-cols-12 lg:gap-x-6">
        <div className="relative order-first mb-[clamp(24px,7vh,54px)] flex h-[50svh] items-center justify-center lg:order-none lg:col-span-4 lg:col-start-5 lg:row-start-1 lg:mb-0 lg:h-full">
          {free ? (
            content
          ) : (
            <div data-phone-anchor className="relative aspect-[.462] h-full max-w-full">
              <div data-scroll-phone className="relative size-full">
                <div data-phone-mask className="size-full overflow-hidden rounded-[44px]">
                  {content}
                </div>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={paused ? 'Play animations' : 'Pause animations'}
                  aria-pressed={paused}
                  className="absolute -right-10 bottom-0 hidden size-8 items-center justify-center rounded-full border border-current text-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-ring lg:flex"
                >
                  {paused ? '▶' : 'Ⅱ'}
                </button>
              </div>
            </div>
          )}
        </div>
        <h2
          data-stage-copy
          className={`${TITLE} mb-[1em] lg:col-span-3 lg:col-start-1 lg:row-start-1`}
        >
          {title}
        </h2>
        <div
          data-stage-copy
          className={`${COPY} lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:-mx-5 [&_p]:mb-8 [&_ul]:mb-8 [&_li]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

function CardFan({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 1 });
  const colors = [
    'bg-ring',
    'bg-secondary',
    'bg-card',
    'bg-chart-5',
    'bg-ring',
    'bg-primary-foreground',
  ];
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="faircoin-editorial-green relative aspect-[1.67] w-full max-w-[480px]"
    >
      {colors.map((color, i) => (
        <motion.div
          key={['green', 'pink', 'paper', 'yellow', 'lime', 'cover'][i]}
          className={`absolute left-1/2 top-1/2 aspect-[1.58] w-full overflow-hidden rounded-[5%] border border-foreground/10 p-[5%] text-primary-foreground shadow-xl ${color}`}
          initial={false}
          animate={{
            rotate: paused || inView ? [-82.5, -75, -60, -45, -30, -15][i] : -90,
            x: '-50%',
            y: '-50%',
          }}
          transition={{
            duration: paused ? 0 : 0.4,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: '50% 50%' }}
        >
          {i === 5 ? (
            <>
              <img
                src="/faircoin/objects/city-helmet.webp"
                alt=""
                className="absolute -left-[8%] -top-[25%] w-[80%]"
                width={960}
                height={960}
                loading="lazy"
              />
              <span className="absolute right-[8%] top-[10%] text-[clamp(12px,1.4vw,22px)] text-primary">
                FairCoin
              </span>
              <img
                src="/images/apps/faircoin.svg"
                alt=""
                className="absolute bottom-[12%] left-[8%] size-[13%]"
              />
            </>
          ) : (
            <span className="float-right text-[clamp(12px,1.4vw,22px)]">FairCoin</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function ObjectFilm({ paused }: { paused: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.5 });
  return (
    <div
      ref={ref}
      className="faircoin-editorial-dark relative flex size-full items-center justify-center overflow-hidden bg-primary-foreground"
      aria-hidden="true"
    >
      <motion.img
        src="/faircoin/objects/home-key.webp"
        width={960}
        height={960}
        alt=""
        loading="lazy"
        className="absolute top-[8%] w-[125%] max-w-none"
        animate={
          paused || !visible
            ? { rotate: 0, scale: 1, y: 0 }
            : { rotate: [-12, 12, -12], scale: [1, 0.9, 1], y: ['0%', '12%', '0%'] }
        }
        transition={{ duration: paused ? 0 : 12, repeat: paused ? 0 : Infinity, ease: 'easeInOut' }}
      />
      <motion.img
        src="/faircoin/objects/market-tote.webp"
        width={960}
        height={960}
        alt=""
        loading="lazy"
        className="absolute bottom-[6%] right-[-8%] w-[78%]"
        animate={paused || !visible ? { rotate: 0, y: 0 } : { rotate: [5, -5, 5], y: [0, -25, 0] }}
        transition={{ duration: paused ? 0 : 9, repeat: paused ? 0 : Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function TransferAmount({ paused }: { paused: boolean }) {
  const value = useMotionValue(200);
  const formatted = useTransform(value, (amount) => String(Math.round(amount)));
  const width = useTransform(value, [0, 200], ['32%', '80%']);
  useEffect(() => {
    if (paused) {
      value.set(200);
      return;
    }
    const playback = animate(value, [0, 75, 75, 150, 150, 200, 200, 0], {
      duration: 4,
      times: [0, 0.125, 0.25, 0.375, 0.5, 0.75, 0.95, 1],
      repeat: Infinity,
      ease: 'easeInOut',
    });
    return () => playback.stop();
  }, [paused, value]);
  return (
    <div
      aria-hidden="true"
      className="faircoin-editorial relative flex h-[32cqw] w-full items-center justify-center text-primary"
    >
      <motion.div className="absolute left-[10.5%] h-full rounded-full bg-card" style={{ width }} />
      <span className="relative flex items-baseline text-[24cqw] leading-none tracking-[-.04em]">
        <span>⊜</span>
        <motion.span>{formatted}</motion.span>
      </span>
    </div>
  );
}

function EverydayGrid({ paused }: { paused: boolean }) {
  const section = useRef<HTMLElement>(null);
  const visible = useInView(section, { amount: 0.4 });
  const [transferPaused, setTransferPaused] = useState(false);
  const items = [
    {
      label: 'Send FairCoin directly to the people around you',
      href: fc('/wallet/'),
      type: 'amount',
    },
    { label: 'Hold your own coins with your own keys', href: fc('/wallet/'), type: 'keys' },
    { label: 'Bring your values into everyday purchases', href: fc('/buy/'), type: 'tote' },
    { label: 'Receive payments in your own wallet', href: fc('/wallet/'), type: 'notification' },
  ];
  return (
    <section
      ref={section}
      id="everyday"
      data-section-tone="dark"
      data-parallax-grid
      className={`faircoin-editorial-dark ${GUTTER} relative overflow-hidden bg-primary-foreground py-[60px] text-foreground lg:h-svh lg:min-h-[700px] lg:py-[10svh]`}
    >
      <div className="lg:flex lg:h-full lg:flex-col lg:justify-center lg:pt-10">
        <div className="mb-12 flex flex-col items-start justify-between gap-7 lg:mb-[clamp(32px,9vh,84px)] lg:flex-row lg:items-end">
          <div>
            <h2 className={TITLE}>Use money in a way that feels right.</h2>
            <p className={`${COPY} mt-[1.75em] text-balance min-[760px]:mt-[1.111em]`}>
              For local exchange, shared projects and the people you care about.
            </p>
          </div>
          <Button href={fc('/wallet/')}>Explore FairCoin</Button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-5">
          {items.map((item) => (
            <div
              key={item.type}
              data-parallax-card
              className="group relative [container-type:inline-size]"
            >
              <Link
                to={item.href}
                className="block outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <div
                  aria-hidden="true"
                  className={`relative flex aspect-[.863402] items-center justify-center overflow-hidden rounded-[15.9%/13%] [container-type:inline-size] ${item.type === 'keys' ? 'faircoin-editorial bg-card text-foreground' : 'faircoin-editorial-green bg-ring text-primary-foreground'}`}
                >
                  {item.type === 'amount' && (
                    <TransferAmount paused={paused || transferPaused || !visible} />
                  )}
                  {item.type === 'keys' && (
                    <div className="grid h-[76%] w-[84%] grid-cols-3 grid-rows-2 gap-x-[5cqw] gap-y-[9cqw]">
                      {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
                        <span
                          key={key}
                          className="bg-primary [mask-image:url('/images/apps/faircoin.svg')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
                        />
                      ))}
                    </div>
                  )}
                  {item.type === 'tote' && (
                    <img
                      src="/faircoin/objects/market-scene.webp"
                      alt=""
                      width={960}
                      height={1112}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                  {item.type === 'notification' && (
                    <>
                      <div
                        className="faircoin-editorial absolute -inset-[15%] rotate-[-20deg] scale-125 bg-card blur-[8cqw]"
                        aria-hidden="true"
                      >
                        <div className="faircoin-editorial-green absolute -left-[5%] -top-[10%] h-[70%] w-[40%] rotate-[-25deg] rounded-full bg-ring" />
                        <div className="faircoin-editorial-green absolute -right-[10%] top-[10%] h-[90%] w-[45%] rotate-[-25deg] rounded-full bg-ring" />
                      </div>
                      <div className="faircoin-editorial relative mx-[7%] flex w-full items-center gap-[3cqw] rounded-[5cqw] bg-card px-[4%] py-[7%] text-foreground shadow-sm">
                        <span className="faircoin-editorial-green flex size-[15cqw] shrink-0 items-center justify-center rounded-full bg-ring text-[6cqw] text-primary-foreground">
                          ↓
                        </span>
                        <span className="text-[4.8cqw] leading-tight">
                          FairCoin received
                          <span className="mt-1 block text-[.75em] text-muted-foreground">
                            12.50 FAIR · Just now
                          </span>
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <p className={`${COPY} mt-2 lg:w-4/5 lg:text-balance`}>{item.label}</p>
              </Link>
              {item.type === 'amount' && (
                <button
                  type="button"
                  disabled={paused}
                  aria-label={
                    transferPaused ? 'Play transfer animation' : 'Pause transfer animation'
                  }
                  aria-pressed={transferPaused}
                  onClick={() => setTransferPaused((value) => !value)}
                  className="faircoin-editorial absolute right-[6%] top-[calc(100cqw/0.863402_-_13cqw)] flex size-[6.5cqw] items-center justify-center rounded-full border border-primary/30 bg-card text-[3cqw] text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {paused || transferPaused ? '▶' : 'Ⅱ'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CashLandingContent({
  phoneRef,
  ready,
  onToneChange,
}: {
  phoneRef: RefObject<HTMLDivElement | null>;
  ready: boolean;
  onToneChange: (dark: boolean) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const motionPaused = paused || !!reduce;
  const toggle = () => setPaused((p) => !p);
  useLandingMotion(root, motionPaused, ready, onToneChange);
  const controls = { paused: motionPaused, toggle };
  return (
    <div
      ref={root}
      className="faircoin-editorial relative isolate bg-card text-foreground [font-family:'FairCoin_Editorial',sans-serif] [--landing-type:clamp(13.76px,calc(0.464328px_+_4.1549vw),32px)] min-[760px]:[--landing-type:clamp(16px,2.10545vw,21.5584px)] lg:[--landing-type:clamp(11.3776px,1.11115vw,16px)] [&_h1]:font-normal [&_h2]:font-normal"
    >
      <div data-landing-canvas className="pointer-events-none fixed inset-0 -z-10 bg-card" />
      <section
        data-faircoin-hero
        data-section-tone="light"
        className={`faircoin-editorial-green ${GUTTER} relative overflow-hidden pb-[70px] pt-[max(120px,calc(var(--site-header-occlusion-bottom,90px)+32px))] text-primary-foreground lg:h-svh lg:min-h-[600px] lg:overflow-visible lg:pb-0 lg:pt-20`}
      >
        <div data-hero-background className="pointer-events-none absolute inset-0 bg-ring" />
        <div
          data-hero-content
          className="relative grid items-center gap-x-5 min-[760px]:text-center lg:h-full lg:grid-cols-12 lg:text-left"
        >
          <h1
            data-hero-copy
            tabIndex={-1}
            className={`${HERO_TITLE} mb-8 w-full outline-none min-[760px]:mx-auto min-[760px]:max-w-[500px] lg:col-span-4 lg:row-start-1 lg:mx-0 lg:mb-0 lg:max-w-none`}
          >
            Money for
            <br />a fairer world.
          </h1>
          <div className="relative order-3 mx-auto mt-8 w-full max-w-[284px] lg:absolute lg:left-1/2 lg:top-[9.5svh] lg:mt-0 lg:w-[30.35vw] lg:max-w-[437px] lg:-translate-x-1/2">
            <div data-hero-device className="text-left">
              <LandingPhone phoneRef={phoneRef} paused={!ready || motionPaused} />
            </div>
          </div>
          <div
            data-hero-copy
            className={`${COPY} w-full min-[760px]:mx-auto min-[760px]:max-w-[500px] lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:mx-0 lg:max-w-none`}
          >
            <p>
              An ethical currency for everyday exchange. FairCoin connects people, local businesses
              and shared projects around a more cooperative economy.
            </p>
            <div className="mt-8">
              <Button variant="inverse" href={fc('/wallet/')}>
                Get started
              </Button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={paused ? 'Play animations' : 'Pause animations'}
          aria-pressed={paused}
          className="absolute bottom-5 left-5 flex size-8 items-center justify-center rounded-full border border-current text-sm"
        >
          {paused ? '▶' : 'Ⅱ'}
        </button>
      </section>
      <Stage
        id="wallet"
        exit="wipe"
        title="Send, receive and do more with FAIRWallet"
        visual={(paused) => <LandingPhone paused={paused} />}
        {...controls}
      >
        <p>
          Keep your FairCoin close and your keys in your hands. Manage your balance, send to a
          friend and follow your activity in one place.
        </p>
        <Button href={fc('/wallet/')}>Meet FAIRWallet</Button>
      </Stage>
      <Stage
        id="possibilities"
        title="Your money, shaped around your values"
        visual={<CardFan paused={motionPaused} />}
        dark
        free
        {...controls}
      >
        <ul>
          <li>Support the people and places around you</li>
          <li>Contribute to projects you believe in</li>
          <li>Exchange value directly with others</li>
          <li>Keep control of your own money</li>
        </ul>
        <Button href={fc('/buy/')}>Get FairCoin</Button>
      </Stage>
      <EverydayGrid paused={motionPaused} />
      <Stage
        id="values"
        title="A little more meaning in every exchange"
        visual={(paused) => <ObjectFilm paused={paused} />}
        {...controls}
      >
        <p>
          Care, cooperation and shared purpose. An ethical currency is a way to put those values
          into everyday practice, one exchange at a time.
        </p>
        <Button href={fc('/wallet/')}>Explore FairCoin</Button>
      </Stage>
      <Stage
        id="pockets"
        title="Make room for what matters to you"
        visual={(paused) => <LandingPhone screen="pockets" paused={paused} />}
        {...controls}
      >
        <p>
          Give your plans a place in FAIRWallet. Organize your coins into pockets for daily life,
          shared projects and the things you want to make happen.
        </p>
        <Button href={fc('/wallet/')}>Explore your wallet</Button>
      </Stage>
      <Stage
        id="send"
        title="Sending money, from one person to another"
        visual={(paused) => <LandingPhone screen="send" paused={paused} />}
        {...controls}
      >
        <ul>
          <li>Send native FAIR directly to a wallet</li>
          <li>Choose a contact or scan an address</li>
          <li>Review the amount and network fee</li>
          <li>Keep track of your payment activity</li>
        </ul>
        <Button href={fc('/wallet/')}>Send FairCoin</Button>
      </Stage>
      <Stage
        id="security"
        dark
        title="Your keys. Your wallet. Your peace of mind."
        visual={(paused) => <LandingPhone screen="security" paused={paused} />}
        {...controls}
      >
        <p>
          Stay in control of your own coins. Protect access to FAIRWallet with a PIN, keep your
          recovery phrase safe and review every payment before sending.
        </p>
        <Button href={fc('/wallet/')}>Explore FAIRWallet</Button>
      </Stage>
      <Stage
        id="community"
        exit="wipe"
        title="A currency for people who care about each other"
        visual={
          <img
            src="/faircoin/objects/community.webp"
            alt="An illustrative scene of an artisan in a ceramics studio"
            width={1000}
            height={1778}
            loading="lazy"
            className="size-full object-cover"
          />
        }
        {...controls}
      >
        <p>
          From a local maker to a shared community project, every exchange connects people. FairCoin
          starts with a simple idea: money should serve the world we want to live in.
        </p>
        <Button href="https://github.com/FairCoinOfficial">Meet the community</Button>
      </Stage>
      <section
        id="get-started"
        data-section-tone="dark"
        className={`faircoin-editorial-dark ${GUTTER} relative bg-primary-foreground py-[60px] text-foreground lg:flex lg:h-svh lg:min-h-[650px] lg:flex-col lg:justify-center lg:py-[10svh]`}
      >
        <h2 className={`${HERO_TITLE} mb-12 max-w-[600px] lg:mb-[18svh]`}>
          FairCoin makes
          <br />
          money meaningful.
        </h2>
        <ExplorerStats />
      </section>
    </div>
  );
}
