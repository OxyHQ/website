import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEO from '../components/SEO';
import WalletLandingContent from '../components/faircoin/wallet/WalletLandingContent';
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

const SEO_TITLE = 'FAIRWallet, your FairCoin wallet';
const SEO_DESCRIPTION =
  'FAIRWallet is the official non-custodial wallet for FairCoin. Send, receive, stake and explore the FairCoin network from one app on Android, iOS, Windows, macOS and Linux.';

/**
 * `/wallet` (or `/faircoin/wallet` on oxy.so) — marketing landing for the
 * FAIRWallet app. Renders the shared Navbar/Footer chrome around
 * `WalletLandingContent`, which composes hero, features, downloads,
 * screenshots, trust narrative and a final CTA.
 */
export default function FairCoinWalletPage() {
  const [darkHeader, setDarkHeader] = useState(false);
  const onFairCoinHost = isFairCoinHost();
  const navbarBrand = useFairCoinNavbarBrand();
  const dropdowns = useFairCoinDropdowns();
  const simpleNavLinks = useFairCoinSimpleNavLinks();
  const ctaButtons = useFairCoinNavCtaButtons();
  const footerBrand = useFairCoinFooterBrand();
  const footerColumns = useFairCoinFooterColumns();
  const footerLegalLinks = useFairCoinFooterLegalLinks();
  const footerCopyright = useFairCoinFooterCopyright();

  const rootClass =
    'faircoin-editorial flex min-h-screen max-w-screen flex-col overflow-x-clip pb-24 lg:pb-0 bg-card text-foreground';

  return (
    <div className={rootClass}>
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin/wallet" />
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
      <main className="flex-1">
        <WalletLandingContent onToneChange={setDarkHeader} />
      </main>
      <Footer
        brand={footerBrand}
        columns={footerColumns}
        socialLinks={onFairCoinHost ? [] : undefined}
        legalLinks={footerLegalLinks}
        copyright={footerCopyright}
      />
    </div>
  );
}
