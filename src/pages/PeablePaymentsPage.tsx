import { PeableScope, PeableButton } from '../components/peable/PeableTheme';
import { useEffect, useRef, useState } from 'react';
import { usePeableMotion } from '../components/peable/usePeableMotion';
import PageShell from '../components/layout/PageShell';
import { Link } from '../lib/navigation';
import { peableImages as images } from '../components/peable/assets';
import {
  Arrow,
  Carousel,
  PeableActions,
  PeableClosing,
  PeableLink,
  PeablePlans,
  PeableQuestions,
  displayTitle,
  pageContainer,
} from '../components/peable/PeableShared';

const methods = [
  {
    name: 'Face to face',
    image: images.method0,
    copy: 'From a busy counter to your next appointment, we’re exploring checkout experiences that keep you close to your customers.',
    link: 'Explore the devices',
    href: '#devices',
  },
  {
    name: 'On the web',
    image: images.method1,
    copy: 'A payment experience that feels at home in your online business. Explore the Oxy ecosystem and the tools available to developers today.',
    link: 'Explore developer tools',
    href: '/developers/',
  },
  {
    name: 'From a distance',
    image: images.method2,
    copy: 'Your customers aren’t always across the counter. Clear payment requests and an easy-to-follow activity history are part of our vision.',
    link: 'See what’s coming',
    href: '#availability',
  },
  {
    name: 'On your terms',
    image: images.method3,
    copy: 'Know the fees before you confirm. Supported payment methods, providers and countries will be announced before launch.',
    link: 'Read the launch details',
    href: '#availability',
  },
];
const devices = [
  {
    name: 'A checkout that moves',
    copy: 'An in-hand experience for the moments when business takes you beyond the counter.',
    image: images.device0,
  },
  {
    name: 'A place for every payment',
    copy: 'A compact terminal experience, from the first tap to the final receipt.',
    image: images.device1,
  },
  {
    name: 'Two sides. One experience.',
    copy: 'Bring the customer and your team into the same clear checkout flow.',
    image: images.device2,
  },
  {
    name: 'Small device. Big possibilities.',
    copy: 'Explore a portable approach to everyday payments.',
    image: images.device3,
  },
  {
    name: 'Make your counter count',
    copy: 'A familiar workspace for the way your team works.',
    image: images.device4,
  },
  {
    name: 'Keep it simple',
    copy: 'A payment experience designed to stay out of your way.',
    image: images.device5,
  },
  {
    name: 'Let customers lead the way',
    copy: 'A self-service experience for a busy day.',
    image: images.device6,
  },
];
const benefits = [
  {
    icon: '↗',
    title: 'Keep business moving',
    copy: 'Reliable checkout is central to the experience we’re building. Connectivity requirements will be documented before launch.',
  },
  {
    icon: 'ϟ',
    title: 'Know where your money goes',
    copy: 'Clear payment status and transparent fees, so you can understand what happens at every step.',
  },
  {
    icon: '⌁',
    title: 'See the bigger picture',
    copy: 'Bring payment activity into the same ecosystem as the rest of your work.',
  },
  {
    icon: '◇',
    title: 'Clarity comes first',
    copy: 'Providers, supported countries and the terms that apply will be named before you can make a deposit.',
  },
];
const reads = [
  { image: images.read0, name: 'Build your next chapter with Oxy', href: '/one/' },
  { image: images.read1, name: 'The principles behind our products', href: '/transparency/' },
  { image: images.read2, name: 'Explore the Oxy ecosystem', href: '/apps/' },
  { image: images.read3, name: 'Follow what we’re building', href: '/features/' },
  { image: images.read4, name: 'Start with the developer tools', href: '/developers/' },
];

export default function PeablePaymentsPage() {
  const root = useRef<HTMLElement>(null);
  usePeableMotion(root);
  const [method, setMethod] = useState(0);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!window.matchMedia('(min-width: 768px)').matches) return;
        for (const entry of entries) {
          if (entry.isIntersecting)
            setMethod(Number((entry.target as HTMLElement).dataset.paymentMethod));
        }
      },
      { rootMargin: '-40% 0px -40% 0px' },
    );
    root.current?.querySelectorAll('[data-payment-method]').forEach((element) => {
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  const [device, setDevice] = useState(0);
  return (
    <PageShell
      className="peable-theme bg-background text-foreground"
      seo={{
        title: 'Peable Payments',
        description:
          'Explore the payment experience Peable is building for individuals, businesses and developers. In development; payments and deposits are not open yet.',
        canonicalPath: '/peable/payments/',
      }}
      mainClassName="flex-1"
    >
      <>
        <article ref={root} className="peable-page overflow-x-clip bg-card text-foreground">
          <section className="pt-20 pb-16 md:pt-[120px] md:pb-24">
            <div className={`${pageContainer} mb-16 text-center md:mb-24`}>
              <p className="mb-6 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Peable payments
              </p>
              <h1 className="peable-display mx-auto max-w-[1300px] text-[48px] md:text-[72px] lg:text-[88px]">
                Your business, wherever it happens
              </h1>
              <div className="mt-8">
                <PeableActions centered />
              </div>
            </div>
            <div className="relative overflow-hidden">
              <div className="peable-marquee flex w-max gap-5 pr-5">
                {[0, 1].map((repeat) => (
                  <div
                    key={repeat}
                    className="flex shrink-0 gap-5"
                    aria-hidden={repeat === 1 ? true : undefined}
                  >
                    {[
                      images.paymentHero0,
                      images.paymentHero1,
                      images.paymentHero2,
                      images.paymentHero3,
                      images.paymentHero4,
                    ].map((src, i) => (
                      <img
                        key={src}
                        src={src}
                        alt={
                          repeat === 0
                            ? [
                                'A retail checkout',
                                'Contactless payment at a restaurant',
                                'A café team serving customers',
                                'A mobile payment experience',
                                'Payments on the go',
                              ][i]
                            : ''
                        }
                        fetchPriority={repeat === 0 && i < 3 ? 'high' : 'auto'}
                        className={`h-[280px] shrink-0 rounded-lg object-cover md:h-[500px] ${i === 1 || i === 2 ? 'w-[350px] md:w-[625px]' : 'w-[280px] md:w-[500px]'}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div
              className={`${pageContainer} mt-14 grid grid-cols-2 gap-x-8 gap-y-10 text-center text-sm font-medium md:mt-24 md:grid-cols-4 md:text-lg`}
            >
              {[
                'A more connected payment experience',
                'Clarity at every step',
                'Your activity in one place',
                'Every fee shown before you confirm',
              ].map((copy) => (
                <p key={copy} className="mx-auto max-w-[220px]">
                  {copy}
                </p>
              ))}
            </div>
          </section>

          <section id="ways-to-pay" className={`${pageContainer} py-20 md:py-[120px]`}>
            <h2 className={`${displayTitle} mb-14 text-center md:mb-20`}>
              Be ready for wherever you sell
            </h2>
            <div className="grid items-start gap-10 md:grid-cols-2 md:gap-[8%]">
              <div className="peable-image-stack sticky top-[calc(var(--site-header-height)+32px)] hidden md:grid">
                {methods.map((item, index) => (
                  <img
                    key={item.image}
                    src={item.image}
                    alt={index === method ? item.name : ''}
                    aria-hidden={index !== method}
                    loading="lazy"
                    className={`aspect-square w-full rounded-lg object-cover ${index === method ? 'opacity-100' : 'opacity-0'}`}
                  />
                ))}
              </div>
              <div>
                {methods.map((item, index) => (
                  <div
                    key={item.name}
                    data-payment-method={index}
                    className={`border-b border-border py-7 first:pt-0 md:flex md:min-h-[60svh] md:flex-col md:justify-center md:py-20 transition-opacity duration-400 ${method === index ? 'opacity-100' : 'md:opacity-30'}`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="mb-8 aspect-square w-full rounded-lg object-cover md:hidden"
                    />
                    <h3>
                      <PeableButton
                        type="button"
                        onClick={(event) => {
                          setMethod(index);
                          if (window.matchMedia('(min-width: 768px)').matches)
                            event.currentTarget.closest('[data-payment-method]')?.scrollIntoView({
                              block: 'center',
                              behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                                .matches
                                ? 'instant'
                                : 'smooth',
                            });
                        }}
                        aria-pressed={method === index}
                        className={`w-full text-left text-[26px] font-medium transition-opacity ${method === index ? '' : 'hover:opacity-100'}`}
                      >
                        {item.name}
                      </PeableButton>
                    </h3>
                    <p className="mt-5 mb-6 max-w-[500px] text-base leading-7 text-muted-foreground">
                      {item.copy}
                    </p>
                    <PeableLink to={item.href}>{item.link}</PeableLink>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="devices" className="container py-20 md:py-[120px]">
            <h2 className={`${displayTitle} mb-16 text-center`}>Find your kind of checkout</h2>
            <div className="grid items-center gap-10 md:grid-cols-[40%_60%]">
              <div className="order-2 md:order-1 md:pr-20">
                <div key={device} className="peable-enter" aria-live="polite">
                  <h3 className="text-xl font-medium">{devices[device].name}</h3>
                  <p className="mt-4 mb-6 max-w-[360px] text-sm text-muted-foreground">
                    {devices[device].copy}
                  </p>
                </div>
                <PeableLink to="#availability">Explore the roadmap</PeableLink>
                <div className="mt-8 flex gap-3">
                  <PeableButton
                    type="button"
                    aria-label="Previous device"
                    onClick={() => setDevice((device + devices.length - 1) % devices.length)}
                    appearance="outline"
                    iconOnly
                    className="size-11 rounded-full"
                  >
                    <Arrow direction="left" />
                  </PeableButton>
                  <PeableButton
                    type="button"
                    aria-label="Next device"
                    onClick={() => setDevice((device + 1) % devices.length)}
                    appearance="outline"
                    iconOnly
                    className="size-11 rounded-full"
                  >
                    <Arrow />
                  </PeableButton>
                </div>
              </div>
              <div className="order-1 overflow-hidden md:order-2">
                <div
                  className="flex transition-transform duration-600 ease-[cubic-bezier(0,0,0.2,1)]"
                  style={{ transform: `translateX(-${device * 100}%)` }}
                >
                  {devices.map((item, index) => (
                    <img
                      key={item.image}
                      src={item.image}
                      alt={index === device ? item.name : ''}
                      aria-hidden={index !== device}
                      loading="lazy"
                      className="aspect-[1.25] w-full shrink-0 object-contain"
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            className={`${pageContainer} grid items-center gap-10 py-20 md:grid-cols-2 md:gap-[6%] md:py-[120px]`}
          >
            <img
              src={images.tap}
              alt="Contactless payment between a card and a phone"
              loading="lazy"
              className="aspect-[1.5] w-full rounded-lg object-cover"
            />
            <div>
              <h2 className="peable-display max-w-[500px] text-[40px] md:text-[56px]">
                A tap.
                <br />A phone.
                <br />A new possibility.
              </h2>
              <div className="mt-7 flex flex-col items-start gap-3">
                <PeableLink to="#availability">Discover the Peable roadmap</PeableLink>
                <PeableLink to="#faq">Device and availability questions</PeableLink>
              </div>
            </div>
          </section>

          <section className={`${pageContainer} py-20 md:py-[120px]`}>
            <h2 className={`${displayTitle} mb-16 text-center`}>Confidence at every step</h2>
            <div className="grid gap-x-20 md:grid-cols-2">
              {benefits.map((item) => (
                <div key={item.title} className="flex gap-6 border-t border-border py-9">
                  <span aria-hidden="true" className="w-7 shrink-0 text-3xl">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-4 mb-5 max-w-[500px] text-sm leading-6 text-muted-foreground">
                      {item.copy}
                    </p>
                    <PeableLink to="#faq">Find out more</PeableLink>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`${pageContainer} py-20 md:py-[120px]`}>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-8">
              <h2 className="peable-display max-w-[580px] text-[40px] md:text-[56px]">
                Your payments.
                <br />
                Part of something bigger.
              </h2>
              <PeableLink to="/peable/">Explore Peable</PeableLink>
            </div>
            <div className="grid gap-10 text-center md:grid-cols-3">
              {[
                {
                  image: images.savings,
                  title: 'A clearer view of your activity',
                  label: 'Explore the payment experience',
                  href: '#ways-to-pay',
                },
                {
                  image: images.checking,
                  title: 'Know the details before you decide',
                  label: 'Read about availability',
                  href: '#availability',
                },
                {
                  image: images.loans,
                  title: 'Connected to the rest of your work',
                  label: 'Discover Oxy apps',
                  href: '/apps/',
                },
              ].map((item) => (
                <div key={item.title}>
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="mx-auto aspect-square w-full max-w-[440px] object-contain"
                  />
                  <h3 className="mx-auto max-w-[310px] text-base font-medium">{item.title}</h3>
                  <PeableLink to={item.href} className="mt-5">
                    {item.label}
                  </PeableLink>
                </div>
              ))}
            </div>
          </section>

          <section className={`${pageContainer} py-20 md:py-[120px]`}>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-8">
              <h2 className="peable-display text-[40px] md:text-[56px]">
                Room for your next big idea
              </h2>
              <PeableLink to="/contact/sales/">Tell us what you’re building</PeableLink>
            </div>
            <PeableScope mode="dark">
              <div
                data-motion-media
                className="peable-dark relative overflow-hidden rounded-lg bg-background text-foreground"
              >
                <img
                  src={images.testimonialBg}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
                />
                <div className="relative grid gap-12 p-8 md:min-h-[650px] md:grid-cols-[32%_1fr] md:p-16">
                  <img
                    src={images.testimonial}
                    alt="The interior of an independent coffee shop"
                    loading="lazy"
                    className="aspect-[2/3] w-full max-w-[320px] rounded object-cover"
                  />
                  <div className="flex flex-col justify-between gap-12">
                    <h3 className="peable-display max-w-[680px] text-[34px] md:text-[46px]">
                      From the first customer to your next location. We’re building Peable for the
                      businesses with somewhere to go.
                    </h3>
                    <div>
                      <p className="mb-2 text-sm font-medium">Built within Oxy</p>
                      <p className="max-w-[450px] text-sm">
                        A connected ecosystem for people, businesses and the ideas that bring them
                        together.
                      </p>
                      <PeableLink to="/company/" className="mt-6">
                        Meet the team behind it
                      </PeableLink>
                    </div>
                  </div>
                </div>
              </div>
            </PeableScope>
          </section>

          <PeablePlans />
          <section className={`${pageContainer} py-20 md:py-[120px]`}>
            <h2 className="peable-display mb-12 text-[40px] md:text-[56px]">
              A little inspiration for what’s next
            </h2>
            <Carousel label="resources">
              {reads.map((item) => (
                <Link key={item.href} to={item.href} className="group block">
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full rounded-lg object-cover transition-opacity group-hover:opacity-85"
                  />
                  <h3 className="mt-6 text-base font-medium">{item.name}</h3>
                </Link>
              ))}
            </Carousel>
          </section>
          <PeableQuestions />
          <PeableClosing />
          <section id="availability" className={`${pageContainer} bg-muted/40 py-14`}>
            <h2 className="mb-6 text-xl font-medium">Peable is in development</h2>
            <div className="grid gap-8 text-xs leading-6 text-muted-foreground md:grid-cols-2">
              <div>
                <p>
                  Payments and deposits are not open. Supported countries, currencies, providers,
                  fees and launch dates will be published before Peable becomes available.
                </p>
                <p className="mt-4">
                  The provider holding any funds, its licence and its jurisdiction will be named
                  before the first deposit. This page does not offer a bank account, credit, deposit
                  insurance or a live payment processing service.
                </p>
              </div>
              <div>
                <p>
                  Product and business photography is taken from the Square pages supplied as the
                  visual reference. Devices, cards and interfaces pictured here are not Peable
                  products available for purchase.
                </p>
                <p className="mt-4">
                  To discuss your requirements,{' '}
                  <PeableLink to="/contact/sales/">contact the Oxy team</PeableLink>. You can also
                  follow development on the <PeableLink to="/features/">feature board</PeableLink>.
                </p>
              </div>
            </div>
          </section>
        </article>
      </>
    </PageShell>
  );
}
