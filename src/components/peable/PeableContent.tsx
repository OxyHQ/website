import { PeableScope, PeableButton } from './PeableTheme';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PeableHero from './PeableHero';
import { PeableProductPreview } from './PeableMedia';
import { Button } from '@oxy.so/bloom/button';
import { usePeableMotion } from './usePeableMotion';
import { Link } from '../../lib/navigation';
import { peableImages as images, peableVideos, peableHardwareVideos } from './assets';
import {
  Carousel,
  PeableClosing,
  PeableLink,
  PeablePlans,
  PeableVideo,
  pageContainer,
} from './PeableShared';

const features = [
  {
    title: 'Payments that fit your business',
    copy: 'A connected way to bring in-person and online payments into your everyday work.',
    image: images.pos,
    to: '/peable/payments/',
  },
  {
    title: 'Bring your team together',
    copy: 'Make room for the people behind your business, with a shared ecosystem built to work together.',
    image: images.team,
    to: '/one/',
  },
  {
    title: 'Build lasting connections',
    copy: 'Keep conversations close and give your customers a reason to come back.',
    image: images.loyalty,
    to: '/mention/',
  },
  {
    title: 'Understand your money',
    copy: 'Clear fees and a clear view of your activity are at the heart of the Peable roadmap.',
    image: images.banking,
    to: '/peable/payments/#availability',
  },
  {
    title: 'Connect the tools you use',
    copy: 'Explore the Oxy apps and developer tools that bring your work into one ecosystem.',
    image: images.apps,
    to: '/developers/',
  },
];
const industries = [
  { title: 'Food & drink', image: images.food, line: 'From the first coffee to the last order.' },
  { title: 'Retail', image: images.retail, line: 'For the shops that make a neighbourhood.' },
  { title: 'Beauty', image: images.beauty, line: 'More time for the people in your chair.' },
  { title: 'Services', image: images.services, line: 'Built around the work only you can do.' },
];

export default function PeableContent() {
  const root = useRef<HTMLElement>(null);
  usePeableMotion(root);
  const [feature, setFeature] = useState(0);
  const [industry, setIndustry] = useState(0);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add(
      '(max-width: 767px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)',
      () => {
        const section = root.current?.querySelector<HTMLElement>('[data-industry-section]');
        const stage = root.current?.querySelector<HTMLElement>('[data-industry-stage]');
        if (!section || !stage) return;
        section.dataset.scroll = 'true';
        const trigger = ScrollTrigger.create({
          trigger: section,
          start: 'top top+=48',
          end: 'bottom bottom',
          onUpdate: (self) => setIndustry(Math.min(3, Math.floor(self.progress * 4))),
        });
        return () => {
          trigger.kill();
          delete section.dataset.scroll;
        };
      },
    );
    return () => media.revert();
  }, []);
  return (
    <>
      <article ref={root} className="peable-page bg-card text-foreground">
        <PeableHero />

        <section
          id="hardware"
          className="container grid items-center gap-10 rounded-3xl bg-background py-12 md:grid-cols-2 md:gap-16 md:py-20"
        >
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Every day starts with you
            </p>
            <h2 className="peable-display max-w-[500px] text-[40px] md:text-[48px] lg:text-[56px]">
              Your craft.
              <br />
              Your community.
              <br />
              Your next chapter.
            </h2>
            <p className="mt-6 max-w-[420px] text-base leading-7 text-muted-foreground">
              The early starts. The familiar faces. The work you put your heart into. We’re building
              Peable to bring a simpler payment experience to your everyday.
            </p>
            <p className="mt-4 max-w-[420px] text-sm leading-6 text-muted-foreground">
              Part of the Oxy ecosystem. Currently in development.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Button asChild appearance="solid" tone="accent" size="lg">
                <Link to="/payments/">Explore payments</Link>
              </Button>
              <PeableLink to="/peable/payments/#availability">See what’s coming</PeableLink>
            </div>
          </div>
          <div
            data-motion-stagger
            className="grid h-[360px] min-w-0 grid-cols-2 grid-rows-2 gap-3 md:h-[480px] md:gap-4"
          >
            <img
              src={images.tile2}
              alt="Florist arranging flowers in her shop"
              loading="lazy"
              className="row-span-2 size-full rounded-full object-cover"
            />
            <img
              src={images.tile7}
              alt="Baker preparing fresh bread"
              loading="lazy"
              className="size-full rounded-[2rem] object-cover"
            />
            <img
              src={images.tile10}
              alt="Barista preparing coffee for customers"
              loading="lazy"
              className="size-full rounded-[2rem] object-cover"
            />
          </div>
        </section>

        <section className="py-20 md:py-[120px]">
          <div className={`${pageContainer} mb-12`}>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              At your counter. On the go.
            </p>
            <h2 className="peable-display text-[40px] md:text-[48px]">
              A simpler way to check out
            </h2>
            <p className="mt-5 max-w-[540px] text-base text-muted-foreground">
              Explore a payment experience that moves with your business, wherever the day takes
              you.
            </p>
            <PeableLink className="mt-7" to="/peable/payments/#devices">
              Explore the possibilities
            </PeableLink>
          </div>
          <Carousel label="checkout devices" fullBleed itemClassName="w-[85%] md:w-[32%]">
            {[
              {
                title: 'At the counter',
                image: images.register,
                video: peableHardwareVideos[0],
                copy: 'A shared view of every checkout.',
              },
              {
                title: 'In your hand',
                image: images.handheld,
                video: peableHardwareVideos[1],
                copy: 'Keep the conversation moving.',
              },
              {
                title: 'Where you need it',
                image: images.terminal,
                video: peableHardwareVideos[2],
                copy: 'A compact checkout experience.',
              },
              {
                title: 'On your phone',
                image: images.tap,
                video: undefined,
                copy: 'Tap into a different way to pay.',
              },
            ].map((item) => (
              <Link key={item.title} to="/peable/payments/#devices" className="group block">
                <div className="flex aspect-[0.78] flex-col bg-background p-6">
                  <PeableProductPreview image={item.image} video={item.video} title={item.title} />
                  <h3 className="pt-8 text-base font-medium">{item.title}</h3>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{item.copy}</p>
              </Link>
            ))}
          </Carousel>
        </section>

        <section className="container grid min-h-[800px] items-center gap-12 py-16 md:min-h-[1100px] md:grid-cols-[42%_58%] md:gap-0 md:py-0">
          <div className="md:py-32 md:pr-16">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Made to work together
            </p>
            <h2 className="peable-display mb-10 max-w-[420px] text-[40px] md:text-[48px]">
              Bring your whole
              <br />
              business together
            </h2>
            {features.map((item, index) => (
              <div key={item.title} className="border-b border-border">
                <h3>
                  <PeableButton
                    type="button"
                    onClick={() => setFeature(index)}
                    aria-expanded={feature === index}
                    aria-controls={`peable-feature-${index}`}
                    className="flex w-full items-center justify-between gap-3 py-5 text-left text-sm font-medium"
                  >
                    {item.title}
                    <span aria-hidden="true">{feature === index ? '−' : '+'}</span>
                  </PeableButton>
                </h3>
                <div
                  id={`peable-feature-${index}`}
                  inert={feature !== index}
                  aria-hidden={feature !== index}
                  className={`grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0,0,0.2,1)] ${feature === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <div className="pb-6">
                      <p className="mb-5 text-sm text-muted-foreground">{item.copy}</p>
                      <PeableLink to={item.to}>Discover more</PeableLink>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="peable-image-stack">
            {features.map((item, index) => (
              <img
                key={item.image}
                src={item.image}
                alt={feature === index ? item.title : ''}
                aria-hidden={feature !== index}
                loading="lazy"
                className={`h-[500px] w-full object-cover md:h-[1100px] ${feature === index ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
          </div>
        </section>

        <PeableScope mode="dark">
          <div className="peable-dark bg-background text-foreground">
            <section data-industry-section className="py-20 md:py-[120px]">
              <div className={`${pageContainer} mb-12`}>
                <p className="mb-5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  For the work you do
                </p>
                <h2 className="peable-display text-[40px] md:text-[48px]">
                  Big ideas. Everyday businesses.
                </h2>
              </div>
              <div
                data-industry-stage
                className="container flex flex-col gap-4 md:h-[620px] md:flex-row"
              >
                {industries.map((item, index) => (
                  <PeableButton
                    key={item.title}
                    type="button"
                    onClick={() => setIndustry(index)}
                    onPointerEnter={() => setIndustry(index)}
                    onFocus={() => setIndustry(index)}
                    aria-label={item.title}
                    aria-expanded={industry === index}
                    className={`peable-industry-card group relative min-h-[110px] overflow-hidden text-center transition-[flex] duration-400 ease-[cubic-bezier(0,0,0.2,1)] md:min-w-0 ${industry === index ? 'min-h-[400px] md:flex-[3.2]' : 'md:flex-1'}`}
                  >
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-background/30" />
                    <div className="peable-industry-copy relative flex h-full w-full min-w-0 flex-col items-center justify-center gap-6">
                      <h3 className="peable-industry-title font-medium">{item.title}</h3>
                      {industry === index && (
                        <p className="peable-industry-line peable-display max-w-[360px]">
                          {item.line}
                        </p>
                      )}
                    </div>
                  </PeableButton>
                ))}
              </div>
            </section>
            <section className="relative grid min-h-[650px] items-center overflow-hidden md:min-h-[900px]">
              <PeableVideo
                src={peableVideos.ai}
                poster={images.apps}
                label="Business reporting interface animation"
                className="absolute inset-0 opacity-60"
              />
              <div className={`relative ${pageContainer} py-28`}>
                <p className="mb-5 font-mono text-xs uppercase tracking-[0.12em]">
                  Intelligence for your next step
                </p>
                <h2 className="peable-display text-[40px] md:text-[48px]">
                  See more.
                  <br />
                  Move forward.
                </h2>
                <p className="mt-5 mb-6 max-w-[420px] text-sm">
                  Explore the tools Oxy is building to help you make sense of your business.
                </p>
                <PeableLink to="/ai/">Explore Oxy AI</PeableLink>
              </div>
            </section>
            <PeablePlans dark />
            <PeableClosing dark />
            <div className={`${pageContainer} pb-16 text-xs leading-6 text-muted-foreground`}>
              <p className="max-w-3xl">
                Peable is in development. Payments, deposits and hardware orders are not available.
                Product photography illustrates the supplied Square design reference; it is not a
                Peable hardware catalogue. Availability, providers and fees will be published before
                launch.
              </p>
            </div>
          </div>
        </PeableScope>
      </article>
    </>
  );
}
