import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { RiLockLine } from '@oxy.so/bloom/icons/RiLockLine';
import { RiArrowDownLine } from '@oxy.so/bloom/icons/RiArrowDownLine';
import { RiArrowUpLine } from '@oxy.so/bloom/icons/RiArrowUpLine';
import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine';
import { RiKey2Line } from '@oxy.so/bloom/icons/RiKey2Line';
import { RiPauseFill } from '@oxy.so/bloom/icons/RiPauseFill';
import { RiPlayFill } from '@oxy.so/bloom/icons/RiPlayFill';
import LandingPhone from '../cash/LandingPhone';
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

/** Original, code-rendered media: the reference's compositions with FAIRWallet UI.
 * All amounts are illustrations. Animation clocks pause offscreen and on request.
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
  const progress = useMotionValue(0);
  const controls = useRef<ReturnType<typeof animate> | null>(null);
  const animated =
    scene !== 'activity' && scene !== 'receive' && scene !== 'lock' && scene !== 'balance';
  useEffect(() => {
    const clock = animate(progress, [0, 0, 1, 1, 0], {
      duration: 7,
      times: [0, 0.15, 0.45, 0.85, 1],
      repeat: Infinity,
      ease: 'easeInOut',
    });
    clock.pause();
    controls.current = clock;
    return () => clock.stop();
  }, [progress]);
  useEffect(() => {
    if (visible && !paused && !reduce && animated) controls.current?.play();
    else controls.current?.pause();
    if (reduce) progress.set(0);
  }, [visible, paused, reduce, animated, progress]);
  const lift = useTransform(progress, [0, 1], ['9%', '-4%']);
  const panelY = useTransform(progress, [0, 1], ['105%', '0%']);
  const glowX = useTransform(progress, [0, 1], ['-10%', '15%']);
  const toggleX = useTransform(progress, [0, 1], ['0%', '85%']);
  const notificationY = useTransform(progress, [0, 1], ['15%', '-15%']);
  const theme = ['activity', 'pockets', 'unlock', 'balance', 'bridge'].includes(scene)
    ? 'faircoin-editorial-dark bg-primary-foreground text-foreground'
    : scene === 'review'
      ? 'faircoin-editorial-green bg-ring text-primary-foreground'
      : 'bg-background text-foreground';
  return (
    <div
      ref={ref}
      data-wallet-scene={scene}
      data-paused={paused || !!reduce || !visible}
      className={`relative isolate w-full overflow-hidden rounded-[12px] lg:rounded-[20px] [container-type:inline-size] ${square ? 'aspect-square' : 'aspect-square lg:aspect-[1.3187]'} ${theme}`}
    >
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {(scene === 'receive' || scene === 'lock') && (
          <div className="faircoin-editorial-green absolute -inset-1/4 rotate-[-30deg] bg-ring">
            <div className="absolute inset-x-0 top-[5%] h-[45%] rounded-full bg-primary-foreground blur-[40px]" />
            <div className="faircoin-editorial absolute inset-x-0 bottom-[5%] h-[35%] rounded-full bg-card blur-[45px]" />
          </div>
        )}
        {scene === 'balance' && (
          <div className="absolute inset-x-[14%] top-[20%]">
            <div className="faircoin-editorial-green absolute -top-[8%] inset-x-[4%] h-[40%] -rotate-6 rounded-[4cqw] bg-ring" />
            <div className="faircoin-editorial relative rounded-[4cqw] bg-card px-[8%] py-[10%] text-foreground">
              <p className="text-center text-[3.5cqw]">FAIR balance</p>
              <p className="mt-[5%] text-center text-[10cqw] tracking-tight">⊜ 512.70</p>
              <div className="mt-[12%] flex gap-[5%] text-center text-[3cqw]">
                <span className="flex-1 rounded-full bg-primary py-[5%] text-primary-foreground">
                  Send
                </span>
                <span className="flex-1 rounded-full bg-primary py-[5%] text-primary-foreground">
                  Receive
                </span>
              </div>
              <div className="mt-[14%] flex justify-between text-[3cqw]">
                <span>My wallet</span>
                <span className="text-muted-foreground">FairCoin</span>
              </div>
            </div>
          </div>
        )}
        {scene === 'bridge' && (
          <motion.div
            style={{ y: lift }}
            className="absolute -top-[22%] inset-x-[15%] space-y-[7%]"
          >
            {[
              'FairCoin mainnet',
              'Wrapped FAIR · Base',
              'Your FairCoin wallet',
              'FairCoin mainnet',
            ].map((label, i) => (
              <div
                key={label + (i === 3 ? '-last' : '')}
                className={`${i % 2 ? 'faircoin-editorial bg-card text-foreground' : 'faircoin-editorial-green bg-ring text-primary-foreground'} aspect-[1.6] rounded-[5cqw] p-[9%]`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[4cqw]">{i % 2 ? 'WFAIR' : 'FAIR'}</span>
                  <span className="size-[8cqw] bg-current [mask-image:url('/images/apps/faircoin.svg')] [mask-size:contain] [mask-repeat:no-repeat]" />
                </div>
                <p className="mt-[21%] text-[3.5cqw]">{label}</p>
              </div>
            ))}
          </motion.div>
        )}
        {scene === 'send' && (
          <div className="absolute left-1/2 top-[5.5%] w-[41%] -translate-x-1/2 lg:w-[31.4%]">
            <LandingPhone screen="send" paused />
            <div className="absolute inset-x-[2%] bottom-[1%] top-[17%] overflow-hidden rounded-b-[38px]">
              <motion.div
                style={{ y: panelY }}
                className="phone-mockup-dark absolute inset-0 flex flex-col items-center rounded-t-[7cqw] bg-background px-[7%] pt-[13%] text-foreground"
              >
                <span className="flex size-[14cqw] items-center justify-center rounded-full bg-primary text-[8cqw] text-primary-foreground">
                  <RiCheckLine fill="currentColor" />
                </span>
                <p className="mt-[10%] text-[4.2cqw]">Review payment</p>
                <p className="mt-[8%] text-[9cqw] tracking-tight">⊜ 12.50</p>
                <p className="mt-[4%] text-[3cqw] text-muted-foreground">FairCoin · Mainnet</p>
                <div className="mt-[14%] w-full border-t border-border pt-[8%] text-[3cqw]">
                  Recipient <span className="float-right">F7a…k2v</span>
                </div>
                <p className="mt-[7%] text-[2.6cqw] text-muted-foreground">
                  Check the address and network fee
                </p>
                <span className="mt-auto mb-[10%] w-full rounded-full bg-primary py-[6%] text-center text-[3.5cqw] text-primary-foreground">
                  Confirm send
                </span>
              </motion.div>
            </div>
          </div>
        )}
        {scene === 'activity' && (
          <div className="absolute left-1/2 top-[10%] w-[60%] -translate-x-1/2 space-y-[1.1cqw]">
            {[
              ['Received', '+ 12.50', 'Today · 10:42'],
              ['Sent', '− 4.00', 'Today · 09:18'],
              ['Received', '+ 50.00', 'Yesterday'],
              ['Sent', '− 8.00', 'Yesterday'],
              ['Received', '+ 20.00', 'Monday'],
            ].map(([label, amount, time]) => (
              <div
                key={amount}
                className="faircoin-editorial flex items-center gap-[3%] rounded-[3cqw] bg-card px-[4%] py-[3.8%] text-foreground"
              >
                <span className="faircoin-editorial-green flex size-[8cqw] shrink-0 items-center justify-center rounded-full bg-ring text-[5cqw] text-primary-foreground">
                  {label === 'Sent' ? (
                    <RiArrowUpLine fill="currentColor" />
                  ) : (
                    <RiArrowDownLine fill="currentColor" />
                  )}
                </span>
                <div className="min-w-0 flex-1 text-[3cqw] leading-tight">
                  <p>{label}</p>
                  <p className="mt-[1cqw] text-[2.3cqw] text-muted-foreground">{time}</p>
                  <p className="mt-[.7cqw] text-[2.2cqw] text-muted-foreground">Confirmed</p>
                </div>
                <span className="self-start pt-[1%] text-right text-[3cqw] leading-tight">
                  {amount}
                  <span className="block text-[2cqw] text-muted-foreground">FAIR</span>
                </span>
              </div>
            ))}
          </div>
        )}
        {scene === 'receive' && (
          <div className="faircoin-editorial absolute left-1/2 top-[9%] w-[36%] -translate-x-1/2 rounded-t-[4cqw] bg-card px-[3%] pb-[12%] pt-[3%] text-center text-foreground lg:w-[30%]">
            <div className="flex justify-between text-[1.5cqw]">
              <span>9:41</span>
              <span>▂▄▆ ▰</span>
            </div>
            <p className="mt-[17%] text-[3.8cqw] tracking-tight">Receive FAIR</p>
            <p className="mt-[6%] text-[1.8cqw] text-muted-foreground">
              Your wallet. Your address.
            </p>
            <QRCodeSVG
              value="FAIRWallet illustrative preview — not a payment address"
              bgColor="var(--card)"
              fgColor="var(--foreground)"
              className="my-[18%] h-auto w-full"
            />
            <p className="break-all text-[1.8cqw] text-muted-foreground">F7a…k2v · Preview</p>
            <span className="mt-[14%] block rounded-full bg-primary py-[8%] text-[2cqw] text-primary-foreground">
              Copy address
            </span>
            <span className="mt-[9%] block text-[2cqw]">Share payment request</span>
          </div>
        )}
        {scene === 'pockets' && (
          <motion.div
            style={{ y: lift }}
            className="absolute left-1/2 top-[5%] w-[42%] -translate-x-1/2 lg:w-[35%]"
          >
            <LandingPhone screen="pockets" paused />
          </motion.div>
        )}
        {scene === 'lock' && (
          <RiLockLine
            fill="currentColor"
            className="absolute left-1/2 top-1/2 size-[33%] -translate-x-1/2 -translate-y-1/2 text-foreground"
          />
        )}
        {scene === 'review' && (
          <motion.div style={{ y: notificationY }} className="absolute inset-x-[8%] top-[43%]">
            <div className="faircoin-editorial absolute -top-[6cqw] inset-x-[13%] h-[17cqw] rounded-[3cqw] bg-card/40" />
            <div className="faircoin-editorial absolute -top-[3cqw] inset-x-[7%] h-[17cqw] rounded-[3cqw] bg-card/70" />
            <div className="faircoin-editorial relative flex items-center gap-[4%] rounded-[3cqw] bg-card p-[5%] text-foreground">
              <span className="faircoin-editorial-green flex size-[10cqw] shrink-0 items-center justify-center rounded-full bg-ring text-[6cqw] text-primary-foreground">
                <RiCheckLine fill="currentColor" />
              </span>
              <span className="text-[4cqw] leading-tight">
                Review before you send
                <span className="mt-[1%] block text-[3.4cqw] text-muted-foreground">
                  Amount, address and network fee
                </span>
              </span>
            </div>
          </motion.div>
        )}
        {scene === 'recovery' && (
          <>
            <motion.div
              style={{ x: glowX }}
              className="absolute -inset-1/4 rotate-[-25deg] bg-[repeating-linear-gradient(90deg,transparent_0_12%,var(--border)_12%_13%)] opacity-60"
            />
            <div className="faircoin-editorial absolute inset-x-[17%] top-[19%] rounded-[4cqw] bg-card p-[6%] text-foreground">
              <RiKey2Line fill="currentColor" className="size-[10cqw]" />
              <p className="mt-[8%] text-[5cqw] leading-tight">Your recovery phrase</p>
              <div className="mt-[14%] grid grid-cols-3 gap-[2cqw]">
                {[
                  'one',
                  'two',
                  'three',
                  'four',
                  'five',
                  'six',
                  'seven',
                  'eight',
                  'nine',
                  'ten',
                  'eleven',
                  'twelve',
                ].map((word) => (
                  <span
                    key={word}
                    className="rounded-[1cqw] bg-muted py-[1cqw] text-center text-[2cqw]"
                  >
                    ••••
                  </span>
                ))}
              </div>
              <p className="mt-[14%] text-[2.8cqw] text-muted-foreground">
                Keep it private. Keep it offline.
              </p>
            </div>
          </>
        )}
        {scene === 'unlock' && (
          <div className="absolute inset-x-0 top-[39%] flex flex-col items-center">
            <div className="faircoin-editorial-green w-[36%] rounded-full bg-ring p-[2%]">
              <motion.div
                style={{ x: toggleX }}
                className="faircoin-editorial flex aspect-square w-[54%] items-center justify-center rounded-full bg-card text-[7cqw] text-foreground"
              >
                <RiLockLine fill="currentColor" />
              </motion.div>
            </div>
            <span className="mt-[5%] text-[6cqw]">Wallet lock</span>
          </div>
        )}
      </div>
      {animated && !reduce && (
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          aria-label={`${paused ? 'Play' : 'Pause'} ${scene} animation`}
          aria-pressed={paused}
          className="faircoin-editorial absolute bottom-2 left-2 z-10 flex size-8 items-center justify-center rounded-full bg-card text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:size-7"
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
