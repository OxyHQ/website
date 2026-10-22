import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { RiLockLine } from '@oxy.so/bloom/icons/RiLockLine';
import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine';
import { RiKey2Line } from '@oxy.so/bloom/icons/RiKey2Line';
import { RiPauseFill } from '@oxy.so/bloom/icons/RiPauseFill';
import { RiPlayFill } from '@oxy.so/bloom/icons/RiPlayFill';
import { useWalletReducedMotion } from './useWalletReducedMotion';

export type WalletScene =
  | 'send'
  | 'activity'
  | 'receive'
  | 'pockets'
  | 'lock'
  | 'review'
  | 'recovery'
  | 'unlock'
  | 'balance'
  | 'bridge';

const FRIENDS = [
  ['Alex Morgan', 'For lunch', '− 12.50', 'Today'],
  ['Jamie Chen', 'Community garden', '+ 31.21', 'Today'],
  ['Noah Rivera', 'For rent', '− 83.81', 'Yesterday'],
  ['Maya Brooks', 'For groceries', '+ 35.00', 'Yesterday'],
  ['Lou Williams', 'Weekend plans', '+ 49.41', 'Monday'],
] as const;

function Avatar({ person = 0, className = '' }: { person?: number; className?: string }) {
  return (
    <span
      className={`block shrink-0 rounded-full bg-cover ${className}`}
      style={{
        backgroundImage: 'url(/faircoin/wallet/friends.webp)',
        backgroundSize: '300% 200%',
        backgroundPosition: `${(person % 3) * 50}% ${Math.floor(person / 3) * 100}%`,
      }}
    />
  );
}
function CoinMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`block bg-current [mask-image:url('/images/apps/faircoin.svg')] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center] ${className}`}
    />
  );
}
function StatusBar() {
  return (
    <div className="flex justify-between px-[12%] pt-[5%] text-[4.3cqw] font-semibold">
      <span>9:41</span>
      <span>▂▄▆ ▰</span>
    </div>
  );
}
/** The reference uses soft, grainy fields of colour, not hard diagonal stripes. */
function SoftBackdrop() {
  return (
    <div className="faircoin-editorial-green absolute inset-0 overflow-hidden bg-ring">
      <div className="absolute -left-[14%] -top-[30%] h-[80%] w-[90%] -rotate-45 rounded-full bg-[color-mix(in_srgb,var(--ring)_30%,var(--primary-foreground))] blur-[7cqw]" />
      <div className="faircoin-editorial absolute -right-[20%] -top-[25%] h-[95%] w-[100%] -rotate-45 rounded-full bg-card/75 blur-[10cqw]" />
      <div className="absolute -bottom-[40%] -left-[30%] h-[90%] w-[115%] -rotate-45 rounded-full bg-[color-mix(in_srgb,var(--ring)_35%,var(--primary-foreground))] blur-[10cqw]" />
      <svg aria-hidden="true" className="absolute size-full opacity-[.12] mix-blend-soft-light">
        <filter id="wallet-media-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#wallet-media-grain)" />
      </svg>
    </div>
  );
}

/** Original FairCoin artwork with the source page's framing and timed sequences.
 * Decorative balances, addresses and people are examples, never connected wallets.
 */
export default function WalletScenes({
  scene,
  square = false,
}: {
  scene: WalletScene;
  square?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.25 });
  const reduce = useWalletReducedMotion();
  const [paused, setPaused] = useState(false);
  const time = useMotionValue(0);
  const controls = useRef<ReturnType<typeof animate> | null>(null);
  const animated = !['activity', 'receive', 'lock', 'balance', 'recovery'].includes(scene);
  useEffect(() => {
    const clock = animate(time, [0, 8], { duration: 8, repeat: Infinity, ease: 'linear' });
    clock.pause();
    controls.current = clock;
    return () => clock.stop();
  }, [time]);
  useEffect(() => {
    if (visible && !paused && !reduce && animated) controls.current?.play();
    else controls.current?.pause();
    if (reduce) time.set(0);
  }, [visible, paused, reduce, animated, time]);
  const sendAmount = useTransform(time, (t): string => (t < 1.2 ? '0' : t < 1.7 ? '6' : '65'));
  const sheetY = useTransform(
    time,
    [0, 2.6, 3.2, 7.2, 7.8, 8],
    ['105%', '105%', '0%', '0%', '105%', '105%'],
  );
  const confirmation = useTransform(time, [0, 4.7, 5.2, 7.2, 7.8, 8], [0, 0, 1, 1, 0, 0]);
  const amount = useTransform(time, (t) =>
    t < 1 ? 125 : t < 1.8 ? 220 : t < 2.6 ? 390 : t < 3.4 ? 410 : 500,
  );
  const amountText = useTransform(amount, (n) => `⊜${n}`);
  const contribution = useTransform(time, (t): string =>
    t < 1 ? '+125' : t < 1.8 ? '+95' : t < 2.6 ? '+170' : t < 3.4 ? '+20' : '+90',
  );
  const ringLength = useTransform(amount, (n) => n / 500);
  const ringScale = useTransform(time, [0, 4.8, 5.8, 6.2, 7.2, 8], [1, 1, 0.8, 0.8, 1, 1]);
  const portraitOpacity = useTransform(time, [0, 5.7, 6.1, 6.8, 7.4, 8], [0, 0, 1, 1, 0, 0]);
  const portraitScale = useTransform(time, [0, 5.7, 6.4, 7.4, 8], [0.15, 0.15, 1, 1, 0.15]);
  const toggled = useTransform(
    time,
    [0, 1.2, 1.6, 4.8, 5.2, 8],
    ['0%', '0%', '77%', '77%', '0%', '0%'],
  );
  const noticeY = useTransform(
    time,
    [0, 1, 1.5, 3.5, 4, 6, 6.5, 8],
    ['0%', '0%', '7%', '7%', '0%', '0%', '7%', '7%'],
  );
  const spend = useTransform(time, (t): string =>
    t < 2 ? '12.50' : t < 4 ? '65.00' : t < 6 ? '31.21' : '20.00',
  );
  const stackY = useTransform(time, [0, 8], ['0%', '-50%']);
  const theme = ['activity', 'unlock', 'balance', 'bridge'].includes(scene)
    ? 'faircoin-editorial-dark bg-primary-foreground text-foreground'
    : scene === 'review'
      ? 'faircoin-editorial-green bg-ring text-primary-foreground'
      : 'faircoin-editorial bg-background text-foreground';
  return (
    <div
      ref={ref}
      data-wallet-scene={scene}
      data-paused={paused || reduce || !visible}
      className={`relative isolate w-full overflow-hidden rounded-[12px] lg:rounded-[20px] [container-type:inline-size] ${square ? 'aspect-square' : 'aspect-square lg:aspect-[1.3187]'} ${theme}`}
    >
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {(scene === 'receive' || scene === 'lock') && <SoftBackdrop />}
        {scene === 'send' && (
          <div className="faircoin-editorial-green absolute left-1/2 top-[5.5%] aspect-[.462] w-[41%] -translate-x-1/2 overflow-hidden rounded-[14%/6.5%] bg-ring text-primary-foreground [container-type:inline-size] lg:w-[31.4%]">
            <StatusBar />
            <div className="mt-[9%] flex items-center justify-between px-[8%] text-[7cqw]">
              <span>⌗</span>
              <span className="ml-auto mr-[8%]">⌕</span>
              <Avatar person={0} className="size-[11cqw]" />
            </div>
            <p className="mt-[13%] text-center text-[28cqw] leading-none tracking-[-.06em]">
              ⊜<motion.span>{sendAmount}</motion.span>
            </p>
            <div className="mt-[22%] grid grid-cols-3 gap-y-[10cqw] px-[4%] text-center text-[7cqw]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '·', '0', '‹'].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
            <div className="mt-[15%] flex gap-[2%] px-[4%] text-center text-[4.3cqw]">
              <span className="flex-1 rounded-full bg-primary-foreground/10 py-[5%]">Receive</span>
              <span className="flex-1 rounded-full bg-primary-foreground/10 py-[5%]">Send</span>
            </div>
            <div className="mt-[7%] flex justify-around text-[6cqw]">
              <span>⌂</span>
              <CoinMark className="size-[7cqw]" />
              <span>◷</span>
            </div>
            <motion.div
              style={{ y: sheetY }}
              className="faircoin-editorial absolute inset-x-0 bottom-0 h-[65%] rounded-t-[10cqw] bg-card p-[4%] text-foreground"
            >
              <div className="mx-auto h-[1.5cqw] w-[9cqw] rounded-full bg-muted-foreground/50" />
              <span className="mt-[6%] block text-[8cqw]">×</span>
              <p className="mt-[6%] text-[8cqw] font-semibold">
                Send ⊜65 <span className="text-muted-foreground">to</span>
              </p>
              <div className="mt-[5%] rounded-full bg-background px-[5%] py-[5%] text-[4cqw] text-muted-foreground">
                ⌕ Name or FairCoin address
              </div>
              {FRIENDS.slice(0, 3).map(([name], i) => (
                <div key={name} className="mt-[8%] flex items-center gap-[5%]">
                  <Avatar person={i} className="size-[13cqw]" />
                  <span className="text-[4.8cqw] font-medium">
                    {name}
                    <span className="block text-[3.5cqw] font-normal text-muted-foreground">
                      Saved contact
                    </span>
                  </span>
                </div>
              ))}
              <motion.div
                style={{ opacity: confirmation }}
                className="absolute inset-0 flex flex-col items-center rounded-t-[10cqw] bg-card px-[7%] pt-[13%]"
              >
                <Avatar person={0} className="size-[26cqw]" />
                <p className="mt-[8%] text-[6cqw]">To Alex Morgan</p>
                <p className="mt-[5%] text-[19cqw] tracking-tight">⊜65.00</p>
                <p className="mt-[4%] text-[4cqw] text-muted-foreground">FairCoin · Mainnet</p>
                <div className="mt-[10%] flex w-full justify-between text-[4cqw]">
                  <span>Network fee</span>
                  <span>Normal</span>
                </div>
                <span className="mt-auto mb-[8%] w-full rounded-full bg-primary py-[6%] text-center text-[5cqw] text-primary-foreground">
                  Review payment
                </span>
              </motion.div>
            </motion.div>
          </div>
        )}
        {scene === 'activity' && (
          <div className="absolute left-1/2 top-[10.2%] w-[77%] -translate-x-1/2 space-y-[1cqw] lg:w-[58.6%]">
            {FRIENDS.map(([name, note, value, date], i) => (
              <div
                key={name}
                className="faircoin-editorial flex h-[20cqw] items-start gap-[3cqw] rounded-[3cqw] bg-card px-[2cqw] py-[1.8cqw] text-foreground lg:h-[15cqw]"
              >
                <Avatar person={i} className="mt-[.2cqw] size-[12cqw] lg:size-[8.8cqw]" />
                <div className="min-w-0 flex-1 text-[3.9cqw] leading-[1.35] lg:text-[3cqw]">
                  <p className="whitespace-nowrap font-semibold">{name}</p>
                  <p className="mt-[.4cqw] whitespace-nowrap text-[3.2cqw] text-muted-foreground lg:text-[2.5cqw]">
                    {note}
                  </p>
                  <p className="text-[3.2cqw] text-muted-foreground lg:text-[2.5cqw]">{date}</p>
                </div>
                <span className="pt-[.2cqw] text-right text-[3.5cqw] font-semibold leading-tight lg:text-[2.9cqw]">
                  {value}
                  <span className="block text-[2.5cqw] font-normal text-muted-foreground lg:text-[1.7cqw]">
                    FAIR
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
        {scene === 'receive' && (
          <div className="faircoin-editorial absolute left-1/2 top-[8.8%] aspect-[.462] w-[43%] -translate-x-1/2 overflow-hidden rounded-[12%/5.5%] bg-card text-foreground [container-type:inline-size] lg:w-[29%]">
            <StatusBar />
            <div className="mt-[7%] flex justify-between px-[6%] text-[8cqw]">
              <span>←</span>
              <span>?</span>
            </div>
            <div className="px-[7%]">
              <p className="mt-[14%] text-[8cqw] font-semibold leading-tight">Receive FairCoin</p>
              <p className="mt-[5%] text-[4.5cqw] text-muted-foreground">
                Your wallet. Your address.
              </p>
              <QRCodeSVG
                value="FAIRWallet illustrative preview — not a payment address"
                bgColor="var(--card)"
                fgColor="var(--foreground)"
                className="mx-auto my-[18%] h-auto w-[88%]"
              />
              <p className="text-center text-[4.5cqw] text-muted-foreground">F7a…k2v · Preview</p>
              <div className="mt-[16%] rounded-full bg-primary py-[7%] text-center text-[5cqw] text-primary-foreground">
                Copy address
              </div>
              <p className="mt-[7%] text-center text-[4.8cqw]">Share payment request</p>
            </div>
            <div className="absolute bottom-[1.5%] left-[34%] h-[1cqw] w-[32%] rounded-full bg-primary" />
          </div>
        )}
        {scene === 'pockets' && (
          <>
            <motion.div
              style={{ scale: ringScale }}
              className="absolute inset-x-[12%] top-1/2 aspect-square -translate-y-1/2 lg:inset-x-[21%]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 400 400"
                className="absolute size-full overflow-visible -rotate-90"
              >
                <circle
                  cx="200"
                  cy="200"
                  r="193"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="3"
                />
                <motion.circle
                  cx="200"
                  cy="200"
                  r="193"
                  fill="none"
                  stroke="var(--ring)"
                  strokeWidth="15"
                  strokeLinecap="round"
                  style={{ pathLength: ringLength }}
                  className="faircoin-editorial-green"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span className="mb-[4%] rounded-full bg-muted/50 px-[5%] py-[2%] text-[4cqw] lg:text-[3cqw]">
                  {contribution}
                </motion.span>
                <motion.span className="text-[16cqw] font-semibold leading-none tracking-[-.065em] lg:text-[12.3cqw]">
                  {amountText}
                </motion.span>
                <span className="mt-[4%] text-[4.8cqw] text-muted-foreground lg:text-[3.5cqw]">
                  in your pocket
                </span>
              </div>
            </motion.div>
            <motion.div
              style={{ opacity: portraitOpacity, scale: portraitScale }}
              className="absolute left-[42%] top-[39%] size-[16%]"
            >
              <Avatar person={1} className="size-full" />
            </motion.div>
          </>
        )}
        {scene === 'lock' && (
          <div className="absolute left-1/2 top-1/2 h-[32%] w-[24%] -translate-x-1/2 -translate-y-1/2 lg:w-[18%]">
            <div className="absolute inset-x-[20%] top-0 h-[60%] rounded-t-full border-[2cqw] border-primary" />
            <div className="absolute inset-x-0 bottom-0 flex h-[68%] items-center justify-center rounded-[4cqw] bg-primary">
              <CoinMark className="faircoin-editorial-green h-[66%] w-[50%] text-ring" />
            </div>
          </div>
        )}
        {scene === 'review' && (
          <motion.div style={{ y: noticeY }} className="absolute inset-x-[8%] top-[43.5%]">
            <div className="faircoin-editorial absolute -top-[13.5cqw] inset-x-[16%] h-[19cqw] rounded-[3cqw] bg-card/30" />
            <div className="faircoin-editorial absolute -top-[7.5cqw] inset-x-[10%] h-[20cqw] rounded-[3cqw] bg-card/70" />
            <div className="faircoin-editorial relative flex items-center gap-[4%] rounded-[4cqw] bg-card px-[5%] py-[6%] text-foreground">
              <span className="faircoin-editorial-green flex size-[10cqw] shrink-0 items-center justify-center rounded-full bg-ring text-[6cqw] text-primary-foreground">
                !
              </span>
              <span className="text-[4.7cqw] font-semibold leading-tight">
                Review your payment
                <span className="mt-[1%] block text-[4.2cqw] font-normal text-muted-foreground">
                  Send ⊜<motion.span>{spend}</motion.span>
                </span>
              </span>
            </div>
          </motion.div>
        )}
        {scene === 'recovery' && (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 400 400"
              className="absolute size-full bg-muted text-card"
              preserveAspectRatio="xMidYMid slice"
            >
              <g fill="none" stroke="currentColor" strokeWidth="2">
                {Array.from({ length: 11 }, (_, i) => (
                  <path
                    key={`street-${i * 54}`}
                    d={`M${i * 54 - 100} -20 L${i * 54 + 100} 420 M-20 ${i * 55 - 130} L420 ${i * 55 + 130}`}
                  />
                ))}
                <path
                  d="M-20 305C100 270 120 160 210 180S320 100 430 60 M100 -20C150 80 80 190 140 250S240 340 220 420"
                  strokeWidth="14"
                />
                <path
                  d="M-20 305C100 270 120 160 210 180S320 100 430 60 M100 -20C150 80 80 190 140 250S240 340 220 420"
                  stroke="var(--border)"
                  strokeWidth="7"
                />
              </g>
            </svg>
            <div className="faircoin-editorial absolute inset-x-[16%] top-[20%] rounded-[4cqw] bg-card p-[4%] text-foreground">
              <span className="faircoin-editorial-green flex size-[8cqw] items-center justify-center rounded-full bg-ring text-[5cqw] text-primary-foreground">
                <RiKey2Line fill="currentColor" />
              </span>
              <p className="mt-[4%] text-[5.5cqw] font-semibold leading-tight">
                Your keys stay
                <br />
                with you
              </p>
              <div className="mt-[13%] space-y-[3cqw] text-[2.9cqw]">
                <p>◉ Self-custody wallet</p>
                <p>⌁ Back up your recovery phrase</p>
                <p>⌘ Keep your backup offline</p>
                <p>⌕ Never share your private keys</p>
              </div>
            </div>
          </>
        )}
        {scene === 'unlock' && (
          <div className="absolute inset-x-0 top-[39.5%] flex flex-col items-center">
            <div className="faircoin-editorial-green w-[35%] rounded-full bg-ring p-[1.5%]">
              <motion.div
                style={{ x: toggled }}
                className="faircoin-editorial flex aspect-square w-[56%] items-center justify-center rounded-full bg-card text-[7cqw] text-foreground"
              >
                <RiLockLine fill="currentColor" />
              </motion.div>
            </div>
            <span className="mt-[4%] text-[6.7cqw]">Wallet lock</span>
          </div>
        )}
        {scene === 'balance' && (
          <div className="absolute inset-x-[13.5%] top-[17%]">
            <div className="faircoin-editorial-green absolute -top-[13%] inset-x-0 h-[45%] overflow-hidden rounded-[4cqw] bg-ring text-primary-foreground">
              <div className="absolute inset-0 opacity-40 bg-[repeating-radial-gradient(ellipse_at_10%_10%,transparent_0_8%,var(--primary-foreground)_9%_10%,transparent_11%_15%)]" />
              <p className="relative px-[8%] pt-[8%] text-[3cqw]">FAIR · My wallet</p>
            </div>
            <div className="faircoin-editorial relative mt-[15%] rounded-[4cqw] bg-card px-[5%] pb-[5%] pt-[11%] text-foreground">
              <p className="text-center text-[3.4cqw] font-semibold">FAIR balance</p>
              <p className="text-center text-[10.5cqw] font-semibold tracking-[-.05em]">⊜512.70</p>
              <div className="mt-[10%] flex gap-[3%] text-center text-[3cqw]">
                {['Send', 'Receive'].map((label) => (
                  <span
                    key={label}
                    className="flex-1 rounded-full bg-primary py-[4%] text-primary-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-[11%] flex items-center justify-between text-[3cqw]">
                <span className="flex items-center gap-[1cqw]">
                  <RiCheckLine fill="currentColor" className="faircoin-editorial-green text-ring" />{' '}
                  My wallet
                </span>
                <span className="text-muted-foreground">FairCoin ›</span>
              </div>
            </div>
          </div>
        )}
        {scene === 'bridge' && (
          <motion.div
            style={{ y: stackY }}
            className="absolute -top-[27%] inset-x-[17%] space-y-[3cqw]"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div
                key={n}
                className={`${n % 3 === 0 ? 'faircoin-editorial bg-card text-foreground' : n % 3 === 1 ? 'faircoin-editorial-green bg-ring text-primary-foreground' : 'faircoin-editorial-dark border border-border bg-primary-foreground text-foreground'} relative aspect-[1.75] overflow-hidden rounded-[3cqw] px-[7%] py-[5%]`}
              >
                <div
                  className={`absolute inset-0 opacity-30 ${n % 2 ? 'bg-[repeating-radial-gradient(ellipse_at_70%_40%,transparent_0_7%,currentColor_7.5%_8%,transparent_8.5%_14%)]' : 'bg-[repeating-linear-gradient(25deg,transparent_0_9%,currentColor_10%_10.5%,transparent_11%_18%)]'}`}
                />
                <div className="relative flex items-center justify-between">
                  <span className="text-[4.5cqw] font-semibold">{n % 2 ? 'WFAIR' : 'FAIR'}</span>
                  <CoinMark className="size-[6cqw]" />
                </div>
                <p className="relative mt-[24%] text-[3cqw]">
                  {n % 2 ? 'Wrapped FAIR · Base' : 'FairCoin · Mainnet'}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
      {animated && !reduce && (
        <button
          type="button"
          aria-label={`${paused ? 'Play' : 'Pause'} ${scene} animation`}
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
          className="faircoin-editorial absolute bottom-[2.5%] left-[2%] z-10 flex size-6 items-center justify-center rounded-full bg-card text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:size-[24px]"
        >
          {paused ? (
            <RiPlayFill fill="currentColor" className="size-3" />
          ) : (
            <RiPauseFill fill="currentColor" className="size-3" />
          )}
        </button>
      )}
    </div>
  );
}
