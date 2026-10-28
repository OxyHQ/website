import { useEffect, useRef, useState, type Ref } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { WalletGlyph } from './FairWalletGlyph';
import {
  WalletHome,
  WalletLock,
  WalletNavigation,
  WalletPockets,
  WalletSendSheet,
} from './FairWalletDemoScreens';
import '../../../styles/faircoin-theme.css';
import './fairwallet-demo.css';

export type PhoneScreen = 'wallet' | 'send' | 'pockets' | 'security';

/** Faithful NativeWind-to-DOM preview of FAIRWallet, using sample data only.
 * Keep the original app's 390pt layout; scale the entire canvas, not its individual
 * fonts/spacings. This preserves the same proportions in every landing section.
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
  const [frame, setFrame] = useState({ scale: 1, height: 844 });
  useEffect(() => {
    const element = inner.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0) setFrame({ scale: width / 390, height: (height * 390) / width });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || reduce || paused || (screen !== 'wallet' && screen !== 'security')) return;
    const timer = window.setInterval(
      () => setPhase((p) => (p + 1) % (screen === 'security' ? 7 : 3)),
      screen === 'security' ? 650 : 5200,
    );
    return () => window.clearInterval(timer);
  }, [visible, reduce, paused, screen]);
  const send = screen === 'send' || (screen === 'wallet' && phase === 2);
  return (
    <div
      ref={phoneRef}
      data-faircoin-phone={screen}
      aria-hidden="true"
      className="fairwallet-app-demo relative aspect-[0.462] w-full overflow-hidden rounded-[44px] border-[5px] border-foreground/15 bg-background text-foreground"
    >
      <div ref={inner} className="absolute inset-0 overflow-hidden">
        <div
          className="fairwallet-demo absolute top-0 left-0 flex w-[390px] origin-top-left flex-col bg-background text-foreground"
          style={{ height: frame.height, transform: `scale(${frame.scale})` }}
        >
          <div className="relative flex h-11 shrink-0 items-center justify-between px-7 text-[13px] font-semibold">
            <span>
              9:41 <span className="ml-1 text-[9px] font-medium text-muted-foreground">DEMO</span>
            </span>
            <span className="absolute left-1/2 top-3 h-[18px] w-[96px] -translate-x-1/2 rounded-full bg-foreground/10" />
            <span className="flex items-center gap-1">
              <WalletGlyph name="signal" size={15} />
              <WalletGlyph name="wifi" size={15} />
              <WalletGlyph name="battery" size={20} />
            </span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <WalletHome activity={phase !== 1 || screen !== 'wallet'} />
            <WalletNavigation />
            {screen === 'pockets' && <WalletPockets />}
            {screen === 'security' && <WalletLock filled={reduce || paused ? 3 : phase} />}
          </div>
          <span className="pointer-events-none absolute bottom-1.5 left-1/2 h-1 w-[110px] -translate-x-1/2 rounded-full bg-foreground/40" />
          <AnimatePresence initial={false}>
            {send && (
              <motion.div
                key="send"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce || paused ? 0 : 0.2 }}
                className="absolute inset-0 bg-background/55"
              >
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ duration: reduce || paused ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-card pb-4 shadow-xl"
                >
                  <WalletSendSheet />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
