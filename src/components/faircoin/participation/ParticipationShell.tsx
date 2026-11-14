import type { ReactNode } from 'react';
import Navbar from '../../layout/Navbar';
import Footer from '../../layout/Footer';
import SEO from '../../SEO';
import { BrandScope } from '../../../theme/BrandScope';
import { isFairCoinHost } from '../../../lib/host';
import { fc } from '../../../lib/faircoin-links';
import { useTranslation } from '../../../lib/i18n';
import {
  useFairCoinDropdowns,
  useFairCoinFooterBrand,
  useFairCoinFooterColumns,
  useFairCoinFooterCopyright,
  useFairCoinFooterLegalLinks,
  useFairCoinNavCtaButtons,
  useFairCoinNavbarBrand,
  useFairCoinSimpleNavLinks,
} from '../../../lib/faircoin-chrome';
import '../cash/fonts.css';

export default function ParticipationShell({
  page,
  children,
}: {
  page: 'participate' | 'pilot';
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const onFairCoinHost = isFairCoinHost();
  const brand = useFairCoinNavbarBrand();
  const dropdowns = useFairCoinDropdowns();
  const links = useFairCoinSimpleNavLinks();
  const buttons = useFairCoinNavCtaButtons();
  const footerBrand = useFairCoinFooterBrand();
  const columns = useFairCoinFooterColumns();
  const legalLinks = useFairCoinFooterLegalLinks();
  const copyright = useFairCoinFooterCopyright();
  const rootClass =
    "faircoin-editorial flex min-h-screen flex-col bg-card text-foreground [font-family:'FairCoin_Editorial',sans-serif]";

  return (
    <BrandScope className={rootClass}>
      <div className={rootClass}>
        <SEO
          title={t(`faircoinParticipation.${page}Title`)}
          description={t(`faircoinParticipation.${page}Description`)}
          canonicalPath={fc(`/${page}/`)}
        />
        <Navbar
          transparent
          transparentOnScroll
          transparentOn="light"
          brand={brand}
          customDropdowns={dropdowns}
          customNavLinks={links}
          ctaButtons={buttons}
          hideAuth={onFairCoinHost}
          hideBanner={onFairCoinHost}
          hideLocalePicker={onFairCoinHost}
        />
        <main className="flex-1 [--participation-banner-height:0px] [body:has(.site-banner)_&]:[--participation-banner-height:var(--site-header-banner-visible-height)] pt-[calc(var(--site-header-height)+var(--participation-banner-height)+32px)] min-[760px]:pt-[calc(var(--site-header-height)+var(--participation-banner-height)+48px)] lg:pt-[calc(var(--site-header-height)+var(--participation-banner-height)+64px)]">
          {children}
        </main>
        <Footer
          brand={footerBrand}
          columns={columns}
          socialLinks={onFairCoinHost ? [] : undefined}
          legalLinks={legalLinks}
          copyright={copyright}
        />
      </div>
    </BrandScope>
  );
}
