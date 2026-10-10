import CommonsIcon from './CommonsIcon';
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Link } from '../../lib/navigation';
import CommonsHero from './CommonsHero';
import CommonsPreviews from './CommonsPreviews';
import {
  AppBadges,
  AppChips,
  AppOrbit,
  CommonsPhoneFilm,
  FingerprintChip,
  PrivacySky,
} from './CommonsIllustrations';
import { commonsFaqItems } from './faqItems';
import FaqSection from '../sections/FaqSection';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function CommonsContent() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-commons-enter]', {
          y: 28,
          opacity: 0,
          filter: 'blur(6px)',
          duration: 1,
          stagger: 0.12,
          ease: 'power3.out',
          clearProps: 'all',
        });
        gsap.utils.toArray<HTMLElement>('[data-commons-reveal]').forEach((element) => {
          gsap.from(element, {
            y: 36,
            opacity: 0,
            filter: 'blur(5px)',
            duration: 0.9,
            ease: 'power3.out',
            clearProps: 'all',
            scrollTrigger: { trigger: element, start: 'top 92%', once: true },
          });
        });
        gsap.from('.commons-manifesto [data-word]', {
          opacity: 0.15,
          filter: 'blur(3px)',
          y: 8,
          stagger: 0.035,
          ease: 'none',
          scrollTrigger: {
            trigger: '.commons-manifesto',
            start: 'top 85%',
            end: 'bottom 70%',
            scrub: 0.5,
          },
        });
        gsap.utils.toArray<HTMLElement>('[data-depth]').forEach((card) => {
          const depth = Number(card.dataset.depth);
          gsap.fromTo(
            card,
            { y: 110 * depth },
            {
              y: -100 * depth,
              ease: 'none',
              scrollTrigger: {
                trigger: '.commons-roadmap-artwork',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.7,
              },
            },
          );
        });
      });
      return () => media.revert();
    },
    { scope: root },
  );

  const words = (text: string) =>
    text.split(' ').map((word, i) => (
      <span key={`${word}-${i}`} data-word className="inline-block">
        {word}
        {'\u00a0'}
      </span>
    ));

  return (
    <div
      ref={root}
      className="commons-page commons-content flex flex-col text-foreground"
      data-slot="home-landing"
    >
      <CommonsHero />
      <section
        id="commons-about"
        className="commons-manifesto commons-serif mx-auto text-center"
        aria-label="About Commons"
      >
        <p>
          {words('Commons')}
          <a
            href="#commons-how-it-works"
            className="commons-manifesto-arrow commons-manifesto-chip"
            aria-label="See how Commons works"
          >
            <CommonsIcon name="arrow" size={42} />
          </a>{' '}
          {words('is your')}
          <br className="hidden md:block" />
          {words('identity, held by you.')}
          <br className="hidden md:block" />
          {words('One key')}
          <AppChips /> {words('for your')}
          <br className="hidden md:block" />
          {words('whole Oxy world. No')}
          <br className="hidden md:block" />
          {words('passwords to remember.')}
          <br className="hidden md:block" />
          {words('Your keys. Your choice.')}
          <br className="hidden md:block" />
          {words('Just')}
          <FingerprintChip /> {words('you.')}
        </p>
      </section>
      <section
        id="commons-how-it-works"
        className="commons-features flex flex-col"
        aria-label="How Commons works"
      >
        <div className="commons-feature-row" data-commons-reveal>
          <AppOrbit />
          <div className="commons-feature-copy">
            <h2>
              One identity.
              <br />
              Your whole Oxy world.
            </h2>
            <p>
              No more starting over in every app. Commons holds the identity you use across the Oxy
              ecosystem.
            </p>
            <Link to="/apps/" className="commons-text-link">
              Explore the apps
            </Link>
          </div>
        </div>
        <div id="commons-security" className="commons-feature-row" data-commons-reveal>
          <PrivacySky />
          <div className="commons-feature-copy">
            <h2>
              Your private key.
              <br />
              Kept private.
            </h2>
            <p>
              Your key is created and held on your device. Approve a sign-in with your face or
              fingerprint. The key stays with you.
            </p>
            <Link to="/transparency/legal/privacy/" className="commons-text-link">
              Learn about privacy
            </Link>
          </div>
        </div>
        <div id="commons-apps" className="commons-feature-row" data-commons-reveal>
          <AppBadges />
          <div id="commons-sign-in" className="commons-feature-copy">
            <h2>
              Different apps.
              <br />
              Still you.
            </h2>
            <p>
              Mention, Allo, Inbox and the rest of Oxy. Scan a sign-in code, check what the app is
              asking for, and choose whether to approve.
            </p>
            <a href="#commons-sign-in" className="commons-text-link">
              See how you sign in
            </a>
          </div>
        </div>
        <div className="commons-feature-row" data-commons-reveal>
          <CommonsPhoneFilm />
          <div className="commons-feature-copy">
            <h2>
              At home
              <br />
              on your phone.
            </h2>
            <p>
              Built for iOS and Android. Your Oxy ID lives in Commons, ready when you need to prove
              it’s you.
            </p>
            <a href="#commons-identity" className="commons-text-link">
              Meet your Oxy ID
            </a>
          </div>
        </div>
      </section>
      <CommonsPreviews />
      <FaqSection
        id="commons-faq"
        title="Frequently asked questions"
        items={commonsFaqItems}
        className="commons-faq-theme flex min-h-[100svh] items-center bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]"
      />
    </div>
  );
}
