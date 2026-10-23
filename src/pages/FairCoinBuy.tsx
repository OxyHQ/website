import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEO from '../components/SEO';
import BuyApp from '../components/faircoin/buy/BuyApp';
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

const SEO_TITLE = 'Buy FairCoin — fairco.in';
const SEO_DESCRIPTION =
  'Buy native FAIR with USDC on Base. Pay from any wallet, the bridge swaps and delivers FAIR straight to your FairCoin address.';

/** Editorial purchase page; BuyApp owns the existing amount → pay → done flow. */
export default function FairCoinBuyPage() {
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
    'faircoin-editorial flex min-h-screen max-w-screen flex-col overflow-x-clip bg-card text-foreground';

  return (
    <div className={rootClass}>
      <SEO title={SEO_TITLE} description={SEO_DESCRIPTION} canonicalPath="/faircoin/buy" />
      <Navbar
        transparent
        transparentOnScroll
        transparentOn="light"
        brand={navbarBrand}
        customDropdowns={dropdowns}
        customNavLinks={simpleNavLinks}
        ctaButtons={ctaButtons}
        hideAuth={onFairCoinHost}
        hideBanner={onFairCoinHost}
        hideLocalePicker={onFairCoinHost}
      />
      <main className="flex-1">
        <BuyApp />
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
