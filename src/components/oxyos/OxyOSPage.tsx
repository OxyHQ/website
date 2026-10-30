import { Badge } from '@oxy.so/bloom/badge';
import Button from '../ui/Button';
import FaqSection, { type FaqEntry } from '../sections/FaqSection';

/* ──────────────────────────────────────────────
 * OxyOS, as it is being rebuilt: its own compositor and display protocol, with
 * Bloom apps drawn natively (OxyHQ/OxyOS, docs/native-architecture.mdx).
 *
 * Every feature below is one implemented on OxyOS's main branch, from its
 * decision records (docs/adr/). An app that is not part of the system yet says
 * so. The downloadable image is still the earlier Openbox desktop, OxyOS 1.0.
 * ──────────────────────────────────────────── */

const REPOSITORY = 'https://github.com/OxyHQ/OxyOS';
const DECISIONS = `${REPOSITORY}/tree/main/docs/adr`;

const foundations = [
  'Linux',
  'Debian',
  'systemd',
  'Vulkan',
  'Mesa',
  'PipeWire',
  'React Native',
  'Rust',
];

const apps: Array<{
  name: string;
  icon: string;
  description: string;
  status: { label: string; tone: 'success' | 'neutral' };
  link?: { label: string; href: string };
}> = [
  {
    name: 'Settings',
    icon: '/images/apps/oxyos-settings.png',
    description:
      'Appearance and accent colour, wallpaper, displays, keyboard, date and time, and accessibility. A change reaches every app at once, with no restart.',
    status: { label: 'In OxyOS', tone: 'success' },
  },
  {
    name: 'Stash',
    icon: '/images/apps/stash.png',
    description:
      'Photos and files by Oxy, and the file manager of OxyOS: what is on the computer and what you keep in Oxy Files, in one place.',
    status: { label: 'Coming to OxyOS', tone: 'neutral' },
    link: { label: 'Stash on GitHub', href: 'https://github.com/OxyHQ/Stash' },
  },
  {
    name: 'Atlas',
    icon: '/images/apps/atlas.png',
    description:
      'The Oxy app store, where you find and review apps built on Oxy. It is the App Store of OxyOS to come, and open on the web today.',
    status: { label: 'Coming to OxyOS', tone: 'neutral' },
    link: { label: 'Open Atlas', href: 'https://atlas.oxy.so' },
  },
];

const features: Array<{ title: string; description: string }> = [
  {
    title: 'Its own compositor',
    description:
      'No X11 and no Wayland. OxyOS draws every window through its own compositor and display protocol, composed on the GPU with Vulkan.',
  },
  {
    title: 'Bloom apps, drawn natively',
    description:
      'Apps are built with Bloom, the design system behind every Oxy app, and run natively on React Native.',
  },
  {
    title: 'Your Oxy account at the login',
    description:
      'Each person on the computer signs in with their Oxy account and its own password, and it still works offline.',
  },
  {
    title: 'Launchpad and the Dock',
    description:
      'Every app on one screen, a click away, and the ones you keep in the Dock along the bottom.',
  },
  {
    title: 'Windows and the overview',
    description:
      'Windows you move, resize and arrange, and an overview that shows every one of them live, across desktops.',
  },
  {
    title: 'One menu bar',
    description:
      'A single bar along the top for the app in front, with the clock and the system status beside it.',
  },
  {
    title: 'Control Center',
    description:
      'Volume, brightness, Wi-Fi, Bluetooth and battery in one panel, and the keyboard’s own volume and brightness keys.',
  },
  {
    title: 'Notifications',
    description:
      'Banners as they arrive, a Notification Center for the rest, and Do Not Disturb when you need quiet.',
  },
  {
    title: 'Every display at its best',
    description:
      'Several displays, each at its own resolution and at the fastest refresh it offers, 120 Hz and above included.',
  },
];

const faqItems: readonly FaqEntry[] = [
  {
    question: 'Can I install the new OxyOS today?',
    answer: (
      <>
        Not yet. The new system is built in the open, and every decision behind it is published in
        the{' '}
        <a
          href={DECISIONS}
          className="font-medium text-primary-text underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary"
        >
          OxyOS repository
        </a>
        . It will be released once its session boots and passes its tests on real hardware.
      </>
    ),
  },
  {
    question: 'What is on the downloads page?',
    answer:
      'OxyOS 1.0 (Ozone), the earlier OxyOS: a lightweight Openbox desktop on Debian. It is still available to download, but it is not the system this page describes.',
  },
  {
    question: 'What are the login credentials for the OxyOS 1.0 live image?',
    answer: "The username and password are both 'live' without the quotes.",
  },
  {
    question: 'Where are the direct downloads?',
    answer: (
      <>
        Every image is listed on our downloads page, with its MD5 checksum at the same URL plus{' '}
        <code>.md5</code>.{' '}
        <a
          href="/os/downloads/"
          className="font-medium text-primary-text underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary"
        >
          Downloads &rarr;
        </a>
      </>
    ),
  },
];

const highlights = [
  {
    title: 'Every display at its fastest refresh',
    description:
      'Each display runs at the fastest refresh it offers, and every app paces its frames by it.',
    href: `${DECISIONS}/0018-several-displays.mdx`,
  },
  {
    title: 'Control Center and the hardware keys',
    description:
      'Volume, brightness, Wi-Fi, Bluetooth and battery in one panel, and the keys that change them.',
    href: `${DECISIONS}/0025-hardware-keys-and-control-center.mdx`,
  },
  {
    title: 'Notifications',
    description:
      'Apps post through expo-notifications, unchanged, and OxyOS shows them as banners and in the Notification Center.',
    href: `${DECISIONS}/0026-notifications.mdx`,
  },
  {
    title: 'Settings',
    description: 'One app for the preferences every other app follows at once.',
    href: `${DECISIONS}/0019-settings.mdx`,
  },
  {
    title: 'Signing in with an Oxy account',
    description:
      'OxyOS’s own login screen, where each person is their Oxy account and its password signs them in.',
    href: `${DECISIONS}/0020-oxy-account-login.mdx`,
  },
];

const linkProps = (href: string) =>
  href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {};

export default function OxyOSContent() {
  return (
    <div className="cursor-theme oxyos-theme">
      {/* ── 1. Hero ── */}
      <section className="page-hero section bg-background text-foreground">
        <div className="container">
          <div className="text-center mx-auto mb-v2.5 max-w-prose-medium-wide">
            <h1 className="type-xl sm:type-2xl text-balance mb-v1">
              An operating system, built on Bloom.
            </h1>
            <p className="type-base text-muted-foreground text-pretty mb-v1">
              OxyOS is being rebuilt from the display up: its own compositor, apps drawn natively
              with Bloom, and your Oxy account at the login. In development, in the open.
            </p>
            <div className="flex flex-wrap justify-center gap-g1 items-center">
              <Button href={REPOSITORY} {...linkProps(REPOSITORY)}>
                Follow development
              </Button>
              <Button variant="ghost" href="/os/downloads">
                Download OxyOS 1.0
              </Button>
            </div>
          </div>
          <div className="media-border-container relative aspect-[16/10] bg-card overflow-hidden">
            <img
              alt="OxyOS lock screen"
              src="/images/oxyos/os-desktop.jpg"
              className="w-full h-full object-cover"
              width={1280}
              height={853}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* ── 2. Foundations ── */}
      <section className="section bg-background text-foreground pb-v1.5 pt-0" id="logo-garden">
        <div className="stack container text-center">
          <h2 className="type-sm mb-v1">Built on open-source foundations</h2>
          <div className="logo-garden-responsive-8">
            {foundations.map((name) => (
              <div key={name} className="relative flex items-center justify-center">
                <div className="bg-surface card-border px-g0.75 flex h-[4rem] w-full items-center justify-center rounded-xs sm:h-[4.5rem] md:h-[6.25rem]">
                  <span className="text-muted-foreground text-sm">{name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Apps ── */}
      <section className="section bg-background text-foreground pb-0" id="apps">
        <div className="container mt-v2">
          <div className="text-left mb-v1 max-w-prose-narrow">
            <h2 className="type-md-lg text-balance">The apps</h2>
          </div>
          <div className="grid gap-g1 grid-cols-1 md:grid-cols-3 items-stretch">
            {apps.map((app) => (
              <div key={app.name} className="h-full">
                <div className="card flex h-full grow-1 flex-col">
                  <div className="type-base max-w-prose flex grow flex-col">
                    <img
                      src={app.icon}
                      alt=""
                      aria-hidden="true"
                      className="mb-v8/12 size-16 rounded-[22%]"
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3>{app.name}</h3>
                      <Badge
                        content={app.status.label}
                        appearance="subtle"
                        tone={app.status.tone}
                        size="label-small"
                      />
                    </div>
                    <div className="text-muted-foreground text-pretty">{app.description}</div>
                    {app.link && (
                      <div className="mt-auto pt-v8/12">
                        <Button variant="ghost" href={app.link.href} {...linkProps(app.link.href)}>
                          {app.link.label} &rarr;
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. What's in OxyOS ── */}
      <section className="section bg-background text-foreground pt-0">
        <div className="container my-v2">
          <div className="text-left mb-v1 max-w-prose-narrow">
            <h2 className="type-md-lg text-balance">What&rsquo;s in OxyOS</h2>
          </div>
          <div className="grid gap-g1 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-stretch">
            {features.map((f) => (
              <div key={f.title} className="h-full">
                <div className="card flex h-full grow-1 flex-col">
                  <div className="type-base max-w-prose flex grow flex-col">
                    <h3>{f.title}</h3>
                    <div className="text-muted-foreground text-pretty">{f.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. FAQ ── */}
      <FaqSection
        title="Frequently asked questions"
        items={faqItems}
        description={
          <p>
            Can&apos;t find the answer you&apos;re looking for? Reach out on our{' '}
            <a
              href={`${REPOSITORY}/issues`}
              className="font-medium text-primary-text underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary"
            >
              GitHub issues
            </a>
            .
          </p>
        }
        className="oxyos-theme flex min-h-[100svh] items-center bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]"
      />

      {/* ── 6. Recent highlights ── */}
      <section className="section bg-surface text-foreground">
        <div className="container">
          <div className="grid-cursor gap-0">
            <div className="col-span-full md:col-start-1 md:col-end-7 lg:col-start-1 lg:col-end-9 xl:col-start-1 xl:col-end-7">
              <h2 className="type-base text-foreground mb-v1 sticky top-0 lg:mb-0">
                Recent highlights
              </h2>
            </div>
            <div className="col-span-full md:col-start-7 md:col-end-25 lg:col-start-9 lg:col-end-25 xl:col-start-7 xl:col-end-19">
              {highlights.map((h, i) => (
                <article
                  key={h.title}
                  className={`flex grow-1 flex-col${i < highlights.length - 1 ? ' mb-g1' : ''}`}
                >
                  <a className="card card--text grow-1" href={h.href} {...linkProps(h.href)}>
                    <div className="flex flex-col">
                      <div className="grow-1">
                        <p className="type-base text-foreground text-pretty">{h.title}</p>
                        <p className="type-base text-muted-foreground text-pretty">
                          {h.description}
                        </p>
                      </div>
                      <div className="mt-v1 text-muted-foreground flex shrink-0 items-center">
                        <span>Feature&nbsp;&middot;&nbsp;</span>
                        <time className="type-base" dateTime="2026-10">
                          Oct 2026
                        </time>
                      </div>
                    </div>
                  </a>
                </article>
              ))}
              <div className="mt-v1">
                <Button variant="ghost" href={DECISIONS} {...linkProps(DECISIONS)}>
                  Every decision record &rarr;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. CTA ── */}
      <section className="section bg-background text-foreground section--headline">
        <div className="container">
          <div className="text-center mx-auto max-w-prose-medium-wide">
            <h2 className="type-xl sm:type-2xl text-balance mx-auto mb-v1">
              Follow OxyOS as it is built.
            </h2>
            <div className="flex justify-center gap-x-g1 items-center flex-wrap">
              <Button href={REPOSITORY} {...linkProps(REPOSITORY)}>
                OxyOS on GitHub
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
