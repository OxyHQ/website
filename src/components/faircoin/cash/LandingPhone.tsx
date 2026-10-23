import { useEffect, useRef, useState, type Ref } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { RiWallet3Line } from '@oxy.so/bloom/icons/RiWallet3Line';
import { RiArrowUpLine } from '@oxy.so/bloom/icons/RiArrowUpLine';
import { RiArrowDownLine } from '@oxy.so/bloom/icons/RiArrowDownLine';
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine';
import { RiMap2Line } from '@oxy.so/bloom/icons/RiMap2Line';
import { RiSettings3Line } from '@oxy.so/bloom/icons/RiSettings3Line';
import { RiWifiLine } from '@oxy.so/bloom/icons/RiWifiLine';
import { RiArrowDownSLine } from '@oxy.so/bloom/icons/RiArrowDownSLine';
import { RiUserLine } from '@oxy.so/bloom/icons/RiUserLine';
import { RiQrCodeLine } from '@oxy.so/bloom/icons/RiQrCodeLine';
import '../../../styles/faircoin-theme.css';

export type PhoneScreen = 'wallet' | 'send' | 'pockets' | 'security';

/** FAIRWallet's current home and Send/Receive sheet, with illustrative data.
 * Source: FAIRWallet/app/(tabs)/index.tsx and src/ui/sheets/SendReceiveSheet.tsx.
 * This is a decorative demo, never a connected wallet or a live market quote.
 */
export default function LandingPhone({
  screen = 'wallet',
  phoneRef,
  paused = false,
}: {
  screen?: PhoneScreen;
  phoneRef?: Ref<HTMLDivElement>;
  paused?: boolean;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const visible = useInView(inner, { amount: 0.65 });
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!visible || reduce || paused || screen !== 'wallet') return;
    const timer = window.setInterval(() => setPhase((p) => (p + 1) % 3), 3200);
    return () => window.clearInterval(timer);
  }, [visible, reduce, paused, screen]);
  const send = screen === 'send' || (screen === 'wallet' && phase === 2);
  const activity = phase > 0;
  return (
    <div
      ref={phoneRef}
      data-faircoin-phone={screen}
      aria-hidden="true"
      className="phone-mockup-dark relative aspect-[0.462] w-full overflow-hidden rounded-[44px] border-[5px] border-foreground/15 bg-background text-foreground [container-type:inline-size] [font-family:system-ui,sans-serif] [&_svg]:size-[1em] [&_svg]:fill-current"
    >
      <div ref={inner} className="size-full">
        <div className="flex items-center justify-between px-[7%] pb-[5%] pt-[5%] text-[3.5cqw] font-semibold">
          <span>9:41</span>
          <span className="absolute left-1/2 top-[3%] h-[4.5cqw] w-[25%] -translate-x-1/2 rounded-full bg-foreground/10" />
          <span className="flex items-center gap-[1cqw]">
            ▂▄▆ <RiWifiLine fill="currentColor" />
            <span className="h-[2.7cqw] w-[5cqw] rounded-[.7cqw] border border-current bg-current" />
          </span>
        </div>
        <div className="flex items-center gap-[2.5cqw] px-[5%] py-[3%]">
          <span className="flex size-[9cqw] items-center justify-center rounded-[3cqw] bg-primary text-[5cqw] text-primary-foreground">
            <RiWallet3Line fill="currentColor" />
          </span>
          <span className="text-[5cqw] font-semibold">My wallet</span>
          <RiArrowDownSLine fill="currentColor" className="text-[5cqw] text-muted-foreground" />
          <RiWifiLine fill="currentColor" className="ml-auto text-[6cqw] text-primary" />
        </div>
        <div className="px-[5%] pb-[7%] pt-[6%]">
          <p className="flex items-baseline gap-[2cqw] text-[17cqw] leading-none tracking-[-.04em] [font-family:Phudu,sans-serif]">
            <span className="text-[12cqw] font-light">⊜</span>512.70
          </p>
          <p className="mt-[4%] text-[3.5cqw] text-muted-foreground">FAIR balance</p>
        </div>
        <div className="flex gap-[2cqw] px-[4%] pb-[6%] text-[3cqw]">
          {[
            [RiArrowUpLine, 'Send'],
            [RiArrowDownLine, 'Receive'],
            [RiAddLine, 'Buy'],
            [RiWallet3Line, 'Pockets'],
          ].map(([Icon, label]) => {
            const Glyph = Icon as typeof RiAddLine;
            return (
              <div
                key={String(label)}
                className="flex flex-1 items-center justify-center gap-[1cqw] rounded-full border border-border py-[3cqw]"
              >
                <Glyph fill="currentColor" className="text-[4cqw]" />
                {String(label)}
              </div>
            );
          })}
        </div>
        <div className="flex gap-[7cqw] border-b border-border px-[5%] text-[3.8cqw]">
          {['Overview', 'Activity'].map((label, i) => (
            <span
              key={label}
              className={`border-b-2 pb-[3cqw] ${Number(activity) === i ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            >
              {label}
            </span>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {activity ? (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce || paused ? 0 : 0.3 }}
              className="px-[5%] pt-[6%]"
            >
              <p className="mb-[5%] text-[2.8cqw] uppercase tracking-wider text-muted-foreground">
                Today
              </p>
              {[
                ['Received', '+12.50', '2 min ago'],
                ['Sent', '−4.00', '1 hour ago'],
                ['Received', '+50.00', 'Yesterday'],
              ].map(([label, amount, time]) => (
                <div key={amount} className="mb-[7%] flex items-center gap-[3cqw]">
                  <span className="flex size-[10cqw] items-center justify-center rounded-full bg-primary/10 text-[5cqw] text-primary">
                    {label === 'Sent' ? (
                      <RiArrowUpLine fill="currentColor" />
                    ) : (
                      <RiArrowDownLine fill="currentColor" />
                    )}
                  </span>
                  <span className="flex-1 text-[3.8cqw]">
                    {label}
                    <span className="mt-[1cqw] block text-[2.8cqw] text-muted-foreground">
                      {time}
                    </span>
                  </span>
                  <span className="text-[4cqw] [font-family:Phudu,sans-serif]">⊜ {amount}</span>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce || paused ? 0 : 0.3 }}
              className="px-[5%] pt-[6%]"
            >
              <p className="text-[2.8cqw] uppercase tracking-wider text-muted-foreground">Market</p>
              <p className="mt-[2cqw] text-[7cqw] [font-family:Phudu,sans-serif]">FairCoin</p>
              <svg
                viewBox="0 0 300 85"
                className="my-[4%] !h-[22cqw] !w-full overflow-visible !fill-none text-primary"
                fill="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M0 60L14 52L26 58L40 40L52 46L68 32L82 36L96 54L110 48L125 56L140 30L156 34L170 24L183 30L198 40L212 32L230 38L246 21L260 26L276 17L290 23L300 18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  initial={false}
                  animate={{ pathLength: 1 }}
                />
              </svg>
              <div className="flex justify-between border-b border-border pb-[5%] text-[2.8cqw] text-muted-foreground">
                <span>1D</span>
                <span>1W</span>
                <span className="text-primary">1M</span>
                <span>1Y</span>
                <span>ALL</span>
              </div>
              <p className="mb-[3%] mt-[7%] text-[2.8cqw] uppercase tracking-wider text-muted-foreground">
                Network
              </p>
              <div className="flex justify-between text-[3.5cqw]">
                <span className="text-muted-foreground">Connection</span>
                <span className="text-primary">Synced</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-x-[3%] bottom-[3%] flex justify-around rounded-full border border-border bg-card py-[3%] text-[2.6cqw] shadow-sm">
          {[
            [RiWallet3Line, 'Wallet'],
            [RiMap2Line, 'Places'],
            [RiAddLine, 'Buy'],
            [RiSettings3Line, 'Settings'],
          ].map(([Icon, label], i) => {
            const Glyph = Icon as typeof RiAddLine;
            return (
              <span
                key={String(label)}
                className={`flex flex-col items-center gap-[1cqw] ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Glyph fill="currentColor" className="text-[5cqw]" />
                {String(label)}
              </span>
            );
          })}
        </div>
        {screen === 'pockets' && (
          <div className="absolute inset-x-0 bottom-0 top-[10%] bg-background px-[5%] pt-[4%]">
            <div className="flex justify-between text-[5cqw] font-semibold">
              <span>‹</span>
              <span>Pockets</span>
              <span>＋</span>
            </div>
            <p className="mt-[9%] text-[2.8cqw] uppercase tracking-wide text-muted-foreground">
              Total across pockets
            </p>
            <p className="mt-[3%] text-[10cqw] [font-family:Phudu,sans-serif]">512.70 FAIR</p>
            <p className="mt-[2%] text-[3cqw] text-muted-foreground">3 pockets</p>
            <div className="mb-[4%] mt-[10%] flex justify-between text-[3cqw]">
              <span className="uppercase text-muted-foreground">Your pockets</span>
              <span className="text-primary">Move coins</span>
            </div>
            {['Everyday', 'Community', 'Shared plans'].map((name, i) => (
              <motion.div
                key={name}
                initial={false}
                whileInView={paused ? {} : { y: [12, 0], opacity: [0.4, 1] }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="mb-[4%] flex items-center gap-[4%] rounded-[4cqw] border border-border bg-card p-[5%]"
              >
                <span className="flex size-[11cqw] items-center justify-center rounded-[3cqw] bg-primary/10 text-[6cqw] text-primary">
                  {['◉', '♡', '✳'][i]}
                </span>
                <span className="flex-1 text-[4cqw]">
                  {name}
                  <span className="mt-[1cqw] block text-[3.5cqw] text-muted-foreground">
                    {['312.70', '100.00', '100.00'][i]} FAIR
                  </span>
                </span>
                <span>›</span>
              </motion.div>
            ))}
            <div className="mt-[5%] rounded-[4cqw] border border-dashed border-border p-[6%] text-[4cqw] text-primary">
              ＋ Create a pocket
            </div>
          </div>
        )}
        {screen === 'security' && (
          <div className="absolute inset-x-0 bottom-0 top-[10%] flex flex-col items-center bg-background px-[8%] pt-[15%]">
            <img src="/images/apps/faircoin-wallet.svg" alt="" className="size-[20cqw]" />
            <p className="mt-[8%] text-[5cqw] font-semibold">Unlock your wallet</p>
            <div className="mt-[9%] flex gap-[3cqw]">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <motion.span
                  key={n}
                  className="size-[3cqw] rounded-full border border-primary bg-primary"
                  animate={
                    paused ? { opacity: n < 3 ? 1 : 0.2 } : { opacity: [0.2, 0.2, 1, 1, 0.2] }
                  }
                  transition={{ duration: 5, delay: n * 0.25, repeat: paused ? 0 : Infinity }}
                />
              ))}
            </div>
            <div className="mt-[20%] grid w-full grid-cols-3 gap-y-[8cqw] text-center text-[8cqw]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '◉', '0', '⌫'].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence>
          {send && (
            <motion.div
              key="send"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: reduce || paused ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 h-[84%] rounded-t-[7cqw] border-t border-border bg-card px-[6%] pt-[3%] shadow-xl"
            >
              <div className="mx-auto mb-[6%] h-[1cqw] w-[12cqw] rounded-full bg-muted-foreground/30" />
              <div className="flex rounded-full bg-surface p-[1cqw] text-center text-[4cqw]">
                <span className="flex-1 rounded-full bg-primary py-[2cqw] text-primary-foreground">
                  Send
                </span>
                <span className="flex-1 py-[2cqw]">Receive</span>
              </div>
              <p className="mt-[12%] text-center text-[17cqw] [font-family:Phudu,sans-serif]">
                ⊜ 12.50
              </p>
              <p className="text-center text-[3cqw] text-muted-foreground">
                Available: 512.70 FAIR
              </p>
              <p className="mb-[2%] mt-[10%] text-[2.8cqw] uppercase text-muted-foreground">
                Send to
              </p>
              <div className="rounded-[4cqw] bg-surface px-[4%] py-[5%] text-[3.5cqw] text-muted-foreground">
                FairCoin address
              </div>
              <div className="mt-[3%] flex gap-[2%] text-[3cqw] text-primary">
                {[
                  [RiQrCodeLine, 'Scan'],
                  [RiUserLine, 'Contacts'],
                  [RiWallet3Line, 'My wallets'],
                ].map(([Icon, label]) => {
                  const Glyph = Icon as typeof RiAddLine;
                  return (
                    <span
                      key={String(label)}
                      className="flex flex-1 items-center justify-center gap-[1cqw] rounded-full bg-surface py-[3cqw]"
                    >
                      <Glyph fill="currentColor" />
                      {String(label)}
                    </span>
                  );
                })}
              </div>
              <p className="mb-[3%] mt-[9%] text-[2.8cqw] uppercase text-muted-foreground">
                Network fee
              </p>
              <div className="flex gap-[2%] text-center text-[3cqw]">
                {['Low', 'Normal', 'High'].map((label) => (
                  <span
                    key={label}
                    className={`flex-1 rounded-full border py-[3cqw] ${label === 'Normal' ? 'border-primary text-primary' : 'border-border'}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-[10%] rounded-full bg-primary py-[4%] text-center text-[4cqw] font-semibold text-primary-foreground">
                Review payment
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
