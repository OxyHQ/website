import { Button } from '@oxy.so/bloom/button';
import { FaqList } from '../sections/FaqSection';
import { PeableScope, PeableButton } from './PeableTheme';
import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { Link } from '../../lib/navigation';
import { peableImages as images } from './assets';
import './peable.css';

export const pageContainer = 'container';
export const displayTitle = 'peable-display text-[38px] md:text-[56px] lg:text-[64px]';

export function PeableLink({
  children,
  to = '/peable/payments/',
  className = '',
}: {
  children: ReactNode;
  to?: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`inline-block text-sm underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-60 ${className}`}
    >
      {children}
    </Link>
  );
}

export function PeableActions({
  centered = false,
  hero = false,
}: {
  centered?: boolean;
  hero?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-3 ${centered ? 'justify-center' : ''}`}>
      <Button asChild appearance="outline" tone="accent" size="lg">
        <Link
          to={hero ? '#hardware' : '/peable/payments/#availability'}
          onClick={
            hero
              ? (event) => {
                  const section = document.getElementById('hardware');
                  if (!section) return;
                  event.preventDefault();
                  section.scrollIntoView({
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                      ? 'instant'
                      : 'smooth',
                    block: 'start',
                  });
                }
              : undefined
          }
        >
          Explore Peable
        </Link>
      </Button>
      <Button asChild appearance="solid" tone="accent" size="lg">
        <Link to={hero ? '/payments/' : '/contact/sales/'}>
          {hero ? 'Explore payments' : 'Talk to our team'}
        </Link>
      </Button>
    </div>
  );
}

export function Arrow({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={direction === 'left' ? 'rotate-180' : ''}
    >
      <path d="M4 12h15M13 5l7 7-7 7" />
    </svg>
  );
}

export function Carousel({
  children,
  label,
  itemClassName = 'w-[82%] md:w-[32%]',
  className = '',
  fullBleed = false,
}: {
  children: ReactNode[];
  label: string;
  itemClassName?: string;
  className?: string;
  fullBleed?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  function move(direction: number) {
    const element = track.current;
    if (!element) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const distance =
      direction * ((element.firstElementChild?.getBoundingClientRect().width ?? 400) + 20);
    const destination = Math.max(
      0,
      Math.min(element.scrollWidth - element.clientWidth, element.scrollLeft + distance),
    );
    gsap.killTweensOf(element);
    if (reduced) element.scrollLeft = destination;
    else
      gsap.to(element, {
        scrollLeft: destination,
        duration: 0.6,
        ease: 'power3.out',
        overwrite: true,
      });
  }
  return (
    <section className={className} aria-label={label} aria-roledescription="carousel">
      <div
        ref={track}
        className={`peable-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto ${fullBleed ? 'peable-carousel-full' : ''}`}
      >
        {Children.map(children, (child) => (
          <div className={`shrink-0 snap-start ${itemClassName}`}>{child}</div>
        ))}
      </div>
      <div className={`mt-6 flex gap-3 ${fullBleed ? pageContainer : ''}`}>
        <PeableButton
          type="button"
          aria-label={`Previous ${label}`}
          onClick={() => move(-1)}
          appearance="outline"
          iconOnly
          className="size-11 rounded-full"
        >
          <Arrow direction="left" />
        </PeableButton>
        <PeableButton
          type="button"
          aria-label={`Next ${label}`}
          onClick={() => move(1)}
          appearance="outline"
          iconOnly
          className="size-11 rounded-full"
        >
          <Arrow />
        </PeableButton>
      </div>
    </section>
  );
}

/** Start video only near the viewport; reduced motion keeps the poster visible. */
export function PeableVideo({
  src,
  poster,
  className = '',
  label,
}: {
  src: string;
  poster?: string;
  className?: string;
  label: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !paused && !reduced.matches) {
          if (!element.src) element.src = src;
          void element.play().catch(() => {
            /* Keep the poster if autoplay is blocked. */
          });
        } else element.pause();
      },
      { rootMargin: '100px' },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.pause();
    };
  }, [src, paused]);
  return (
    <div className={`overflow-hidden ${className}`}>
      <video
        ref={video}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 size-full object-cover"
        aria-label={label}
      />
      <PeableButton
        type="button"
        onClick={() => setPaused(!paused)}
        aria-label={paused ? 'Play background video' : 'Pause background video'}
        aria-pressed={paused}
        appearance="outline"
        iconOnly
        className="absolute right-5 bottom-5 z-20 size-11 rounded-full backdrop-blur-sm"
      >
        {paused ? (
          <span aria-hidden="true">▶</span>
        ) : (
          <span aria-hidden="true" className="flex gap-1">
            <span className="h-3 w-0.5 bg-current" />
            <span className="h-3 w-0.5 bg-current" />
          </span>
        )}
      </PeableButton>
    </div>
  );
}

export function PeablePlans({ dark = false }: { dark?: boolean }) {
  const plans = [
    {
      name: 'For individuals',
      title: 'Your everyday',
      description: 'A clearer view of the payments you make across Oxy.',
    },
    {
      name: 'For businesses',
      title: 'Your next step',
      description: 'A connected payment experience for the way you work.',
    },
    {
      name: 'For developers',
      title: 'Your platform',
      description: 'Build payment experiences into your own products.',
    },
  ];
  return (
    <section
      id="plans"
      className={`${pageContainer} py-20 md:py-[120px] ${dark ? '' : 'rounded-lg bg-muted/40'}`}
    >
      <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
            One connected experience
          </p>
          <h2 className="peable-display text-[36px] md:text-[48px]">
            A place for every way you work
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Peable is in development. Availability and pricing will be published before launch.
          </p>
        </div>
        <PeableLink to="/peable/payments/#availability">See what’s coming</PeableLink>
      </div>
      <div data-motion-stagger className="grid gap-5 md:grid-cols-3">
        {plans.map((plan, index) => (
          <div
            key={plan.name}
            className={`flex min-h-[300px] flex-col p-7 ${dark ? 'border-l border-border' : 'bg-card'}`}
          >
            <h3 className="text-xl font-medium">{plan.name}</h3>
            <p className="mt-3 min-h-14 text-sm text-muted-foreground">{plan.description}</p>
            <div className="my-6 border-t border-border" />
            <p className="peable-display text-[36px]">{plan.title}</p>
            <p className="mt-3 mb-7 text-xs text-muted-foreground">In development</p>
            <Button
              asChild
              appearance={index === 1 ? 'solid' : 'outline'}
              tone="accent"
              className="mt-auto"
            >
              <Link to={index === 2 ? '/developers/' : '/peable/payments/#availability'}>
                {index === 2 ? 'Explore Oxy for developers' : 'Explore the roadmap'}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PeableClosing({ dark = false }: { dark?: boolean }) {
  return (
    <PeableScope mode={dark ? 'dark' : undefined}>
      <section
        data-image-trail={dark || undefined}
        className={
          dark
            ? 'peable-dark relative isolate flex min-h-[650px] items-center bg-background text-foreground'
            : 'py-24 md:py-36'
        }
      >
        {dark && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 hidden md:block"
          >
            {[
              images.tile1,
              images.tile7,
              images.tile10,
              images.tile14,
              images.tile4,
              images.tile17,
            ].map((src, i) => (
              <img
                key={src}
                data-trail-image
                src={src}
                alt=""
                loading="lazy"
                className="absolute size-[110px] rounded-2xl object-cover lg:size-[150px]"
                style={{
                  left: `${[6, 76, 15, 84, 4, 70][i]}%`,
                  top: `${[15, 9, 65, 65, 42, 42][i]}%`,
                  transform: `rotate(${[8, -8, -12, 8, -4, 12][i]}deg)`,
                }}
              />
            ))}
          </div>
        )}
        <div
          className={`${pageContainer} relative z-10 flex ${dark ? 'flex-col items-center justify-center' : 'flex-wrap items-center justify-between gap-8'}`}
        >
          <h2
            className={`${dark ? 'mb-8 max-w-[440px] text-center text-[64px] md:text-[80px]' : 'text-[48px] md:text-[64px]'} peable-display`}
          >
            {dark ? 'Your next chapter starts here.' : 'Meet Peable'}
          </h2>
          <PeableActions centered={dark} />
        </div>
      </section>
    </PeableScope>
  );
}

const peableFaqs = [
  [
    'Can I start accepting payments with Peable?',
    'Peable is in development. Payment processing and deposits are not open yet. We will publish supported countries, eligibility and onboarding details before launch.',
  ],
  [
    'Where will processing fees be published?',
    'Fees will be shown before you confirm a payment. Pricing and any applicable limits will be published before the service becomes available.',
  ],
  [
    'How will my money be held?',
    'The provider, licence and country responsible for holding funds will be named before deposits open. This preview does not offer a bank account or deposit protection.',
  ],
  [
    'Will I be able to take contactless payments?',
    'The payment methods and compatible devices shown here describe the intended experience. Supported hardware and device requirements will be confirmed before launch.',
  ],
  [
    'Can I use Peable for my business?',
    'We are exploring payment experiences for individuals, businesses and developers. Talk to the Oxy team about your requirements.',
  ],
  [
    'How does Peable fit into Oxy?',
    'Peable is the payments project within the Oxy ecosystem. Its aim is to make payments across Oxy products easier to understand and manage.',
  ],
  [
    'Will Peable work with my website?',
    'Integration details, SDK documentation and supported checkout methods will be published when they are ready. Explore the Oxy developer documentation for what is available today.',
  ],
  [
    'Which payment methods will be supported?',
    'The supported cards, wallets, currencies and countries have not been announced. We will list them explicitly before launch.',
  ],
  [
    'Is there a Peable card available today?',
    'No. Hardware and card photography on this preview comes from the supplied visual reference; it does not represent a Peable product available to order.',
  ],
  [
    'Where can I follow development?',
    'Visit the Oxy feature board and changelog to follow the projects being built across the ecosystem.',
  ],
  [
    'How can I contact the team?',
    'Use the “Talk to our team” link to send your requirements through the Oxy contact form.',
  ],
] as const;

export function PeableQuestions() {
  return (
    <section id="faq" className={`${pageContainer} py-20 md:py-[120px]`}>
      <h2 className="peable-display mb-12 text-4xl">Your questions, answered</h2>
      <FaqList
        idPrefix="peable-faq"
        type="multiple"
        items={peableFaqs.map(([question, answer]) => ({ question, answer }))}
        questionClassName="text-sm font-medium"
        answerClassName="max-w-3xl pb-7 pr-10 text-sm leading-7 text-muted-foreground"
      />
    </section>
  );
}
