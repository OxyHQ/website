import { BloomColorScope } from '@oxy.so/bloom/theme';
import { FAIRCOIN_PRESET } from '../theme/brands';
import { useCallback, useRef, useState } from 'react';
import CashLandingContent from '../components/faircoin/cash/CashLandingContent';
import FairCoinIntro from '../components/faircoin/cash/FairCoinIntro';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEO from '../components/SEO';
import { isFairCoinHost } from '../lib/host';
import {
  useFairCoinDropdowns,
  useFairCoinFooterBrand,
  useFairCoinFooterColumns,
  useFairCoinFooterCopyright,
  useFairCoinFooterLegalLinks,
  useFairCoinNavCtaButtons,
  useFairCoinNavbarBrand,
  useFairCoinSimpleNavLinks,
} from '../lib/faircoin-chrome';

const SEO_TITLE = 'FairCoin — ethical, community-run currency';
const SEO_DESCRIPTION =
  'An ethical currency for everyday exchange, local communities and shared projects. Explore FairCoin and manage your own coins with FAIRWallet.';

export default function FairCoinLanding() {
  const [darkHeader, setDarkHeader] = useState(false);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [introActive, setIntroActive] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !window.location.hash,
  );
  const finishIntro = useCallback(() => setIntroActive(false), []);
  const onFairCoinHost = isFairCoinHost();
  const navbarBrand = useFairCoinNavbarBrand();
  const dropdowns = useFairCoinDropdowns();
  const simpleNavLinks = useFairCoinSimpleNavLinks();
  const ctaButtons = useFairCoinNavCtaButtons();
  const footerBrand = useFairCoinFooterBrand();
  const footerColumns = useFairCoinFooterColumns();
  const footerLegalLinks = useFairCoinFooterLegalLinks();
  const footerCopyright = useFairCoinFooterCopyright();

  // The FairCoin landing page owns its visual identity on both hosts. The
  // chrome changes on fairco.in, but the content surface always follows the
  // FairCoin Bloom recipe instead of inheriting Oxy's saved preset.
  const rootClass =
    'faircoin-editorial flex min-h-screen max-w-screen flex-col overflow-x-clip bg-card';

  return (
    <div className={rootClass}>
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin" />
      <div inert={introActive}>
        <Navbar
          transparent
          transparentOnScroll
          transparentOn={darkHeader ? 'dark' : 'light'}
          brand={navbarBrand}
          customDropdowns={dropdowns}
          customNavLinks={simpleNavLinks}
          ctaButtons={ctaButtons}
          hideAuth={onFairCoinHost}
          hideBanner={onFairCoinHost}
          hideLocalePicker={onFairCoinHost}
        />
        <BloomColorScope colorPreset={FAIRCOIN_PRESET} mode="light" asChild>
          <main className="flex-1">
            <CashLandingContent
              phoneRef={phoneRef}
              ready={!introActive}
              onToneChange={setDarkHeader}
            />
          </main>
        </BloomColorScope>
        <Footer
          brand={footerBrand}
          columns={footerColumns}
          socialLinks={onFairCoinHost ? [] : undefined}
          legalLinks={footerLegalLinks}
          copyright={footerCopyright}
        />
      </div>
      {introActive && <FairCoinIntro target={phoneRef} onComplete={finishIntro} />}
    </div>
  );
}
