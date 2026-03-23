const featureCards = [
  {
    title: 'Lightweight by design',
    description: 'OxyOS strips away the bloat. A minimal Openbox desktop that boots fast and stays out of your way, so you can focus on what matters.',
    cta: 'Learn more about Openbox \u2192',
    ctaHref: 'http://openbox.org/',
    layout: 'left' as const,
  },
  {
    title: 'ARM64 ready',
    description: 'First-class support for Snapdragon X Elite and Plus laptops. Qualcomm firmware tools, Mesa Freedreno GPU drivers, and EFI boot — all included.',
    cta: 'See supported hardware \u2192',
    ctaHref: '#hardware',
    layout: 'right' as const,
  },
  {
    title: 'Debian at the core',
    description: 'Built on Debian Trixie (13) with access to the entire Debian package ecosystem. Stable, secure, and well-documented.',
    cta: 'Debian 13 release notes \u2197',
    ctaHref: 'https://www.debian.org/releases/trixie/release-notes/',
    layout: 'left' as const,
  },
]

const logoPartners = ['Debian', 'Openbox', 'Pipewire', 'Wayland', 'systemd', 'GRUB', 'Mesa', 'Linux']

const newFeatures = [
  {
    title: 'Debian 13 base',
    description: 'Built on Debian Trixie with access to the full Debian package ecosystem.',
    link: { label: 'Release notes \u2197', href: 'https://www.debian.org/releases/trixie/release-notes/' },
  },
  {
    title: 'Linux 6.18',
    description: 'Latest stable Linux kernel with full Snapdragon X support.',
  },
  {
    title: 'Pipewire Support',
    description: 'A modern audio daemon replacing PulseAudio, with better performance and lower latency.',
    link: { label: 'Learn more \u2197', href: 'https://wiki.debian.org/PipeWire' },
  },
  {
    title: 'Power Profiles',
    description: 'Easily switch between performance and power saving modes right from the Openbox menu using powerprofilesctl.',
  },
  {
    title: 'ARM64 / Snapdragon X',
    description: 'Native support for ARM64 laptops including Snapdragon X Elite/Plus devices. Includes Qualcomm firmware tools, Mesa Freedreno GPU drivers, and EFI boot.',
  },
]

const screenshots = [
  '/images/oxyos/screenshot-1.png',
  '/images/oxyos/screenshot-2.png',
  '/images/oxyos/screenshot-3.png',
  '/images/oxyos/screenshot-4.png',
]

const testimonials = [
  { quote: 'Finally a distro that respects my hardware. Boots in under 10 seconds on my ThinkPad.', author: 'Alex R.', role: 'Systems Engineer' },
  { quote: 'OxyOS on Snapdragon X is surprisingly smooth. The ARM64 support is legit.', author: 'Priya K.', role: 'Hardware Reviewer' },
  { quote: 'I switched from Arch to OxyOS. Less time configuring, more time working.', author: 'Marcus T.', role: 'Backend Developer' },
  { quote: 'The Openbox setup is clean and snappy. Exactly what a lightweight distro should be.', author: 'Sarah L.', role: 'DevOps Engineer', hidden: true },
  { quote: 'Running this on a 10 year old laptop and it flies. Debian base means rock solid stability.', author: 'David M.', role: 'IT Admin', hidden: true },
  { quote: 'Pipewire out of the box was the cherry on top. Audio just works.', author: 'Yuki N.', role: 'Music Producer' },
]

const faqItems = [
  {
    question: 'What are the login credentials for the live image?',
    answer: "The username and password are both 'live' without the quotes.",
  },
  {
    question: 'What happened to the i686 (32-bit) image?',
    answer: 'Debian has dropped support for the i686 architecture as a first class architecture. While it is still possible to run a 32-bit userland on a 64-bit kernel, we will no longer produce a 32-bit image.',
  },
  {
    question: 'Will you still be supporting older OxyOS releases?',
    answer: "Debian continues to issue security updates for ~1 year after a new 'stable' is released. While the older OxyOS releases won't be getting any new updates from us, the repos will continue to be available for at least the next year as well.",
  },
  {
    question: 'Where are the direct downloads?',
    answer: 'All older images are still available via GitHub Releases on the image source repo.',
    link: { label: 'GitHub Releases \u2192', href: 'https://github.com/OxyHQ/OxyOS/releases' },
  },
  {
    question: 'Does OxyOS work on Snapdragon X laptops?',
    answer: 'Yes! Download the ARM64 ISO and boot from USB with Secure Boot disabled. After booting, run',
    code: 'sudo oxyos-qcom-firmware',
    answerEnd: 'to extract GPU firmware from your Windows partition for full graphics support.',
  },
]

const hardwareCards = [
  {
    title: 'x86_64 / amd64',
    description: 'Standard desktop and laptop PCs with Intel or AMD processors. Full hardware support out of the box.',
    specs: ['Intel Core / AMD Ryzen', 'BIOS and UEFI boot', 'Full GPU support (Intel, AMD, NVIDIA)'],
    download: { label: 'Download amd64', href: 'https://downloads.os.oxy.so/oxyos-1.8.2-amd64.iso' },
  },
  {
    title: 'ARM64 / Snapdragon X',
    description: 'ARM-based laptops including Snapdragon X Elite and Plus devices. Qualcomm firmware tools included.',
    specs: ['Snapdragon X Elite / Plus', 'UEFI boot (EFI only)', 'Mesa Freedreno GPU drivers'],
    download: { label: 'Download arm64', href: 'https://downloads.os.oxy.so/oxyos-1.8.2-arm64.iso' },
  },
  {
    title: 'Minimum Requirements',
    description: 'OxyOS is designed to be lightweight. It runs well on modest hardware and flies on modern machines.',
    specs: ['1 GHz processor (64-bit)', '512 MB RAM (1 GB recommended)', '10 GB disk space', 'USB port for live boot'],
  },
]

const highlights = [
  { title: 'OxyOS 1.8.2 released with ARM64 support', description: 'Native Snapdragon X support lands in OxyOS with full GPU drivers and firmware tools.', category: 'release', date: 'Mar 2026', href: 'https://github.com/OxyHQ/OxyOS/releases' },
  { title: 'Pipewire replaces PulseAudio', description: 'Lower latency, better Bluetooth support, and seamless audio switching out of the box.', category: 'feature', date: 'Feb 2026', href: '#' },
  { title: 'Debian Trixie base upgrade', description: 'OxyOS now builds on Debian 13, bringing thousands of updated packages and improved security.', category: 'update', date: 'Jan 2026', href: '#' },
  { title: 'Power profiles integration', description: 'Switch between performance and battery saving modes directly from your Openbox menu.', category: 'feature', date: 'Dec 2025', href: '#' },
]

export default function OxyOSContent() {
  return (
    <div className="cursor-theme oxyos-theme">
      {/* ── 1. Hero ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="text-left mb-v2.5 max-w-prose">
            <h1 className="type-xl sm:type-2xl text-balance mb-v1">
              A minimal Linux distro, built to stay out of your way.
            </h1>
            <p className="type-base text-theme-text-sec text-pretty mb-v1">
              OxyOS is a lightweight desktop Linux project. Still small, still fast, built on Debian Trixie. Now available for x86_64 and ARM64 (Snapdragon X).
            </p>
            <div className="flex justify-start gap-x-g1 items-center">
              <div>
                <div className="hidden items-center md:flex">
                  <a className="btn" href="https://downloads.os.oxy.so/oxyos-1.8.2-amd64.iso">
                    Download ISO (amd64)
                    <div aria-hidden="true" className="btn-icon">
                      <span aria-hidden="true">&#x2913;</span>
                    </div>
                  </a>
                </div>
                <div className="flex items-center md:hidden">
                  <a className="btn" href="https://github.com/OxyHQ/OxyOS/releases">
                    All Downloads
                    <div aria-hidden="true" className="btn-icon">
                      <span aria-hidden="true">&rarr;</span>
                    </div>
                  </a>
                </div>
              </div>
              <div className="hidden md:block">
                <a className="btn btn--secondary" href="https://downloads.os.oxy.so/oxyos-1.8.2-arm64.iso">
                  ARM64 ISO
                  <div aria-hidden="true" className="btn-icon">
                    <span aria-hidden="true">&rarr;</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <div className="media-border-container relative aspect-[16/10] bg-theme-card overflow-hidden">
            <img
              alt="OxyOS desktop screenshot"
              src="/images/oxyos/hero.png"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── 2. Logo Garden ── */}
      <section className="section bg-theme-bg text-theme-text pb-v1.5 pt-0" id="logo-garden">
        <div className="stack container text-center">
          <h2 className="type-sm mb-v1">
            Built on battle-tested open source foundations
          </h2>
          <div className="logo-garden-responsive-8">
            {logoPartners.map((name) => (
              <div key={name} className="relative flex items-center justify-center">
                <div className="bg-theme-card-hex card-border px-g0.75 flex h-[4rem] w-full items-center justify-center rounded-xs sm:h-[4.5rem] md:h-[6.25rem]">
                  <span className="text-theme-text-sec text-sm">{name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Feature Cards (large, alternating layout) ── */}
      <section className="section section--flush-x">
        {featureCards.map((feature, i) => (
          <section key={feature.title} className="section bg-theme-bg text-theme-text section--flush-y">
            <div className={i < featureCards.length - 1 ? 'container mb-v4' : 'container'}>
              <div className="grid grid-rows-[auto_1fr]">
                <a
                  className="card card--large card--feature grid-cursor col-span-full row-span-full gap-y-0 max-lg:grid-rows-subgrid"
                  href={feature.ctaHref}
                  {...(feature.ctaHref.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {/* Text column */}
                  <div
                    className={`col-span-full row-start-1 row-end-2 grid lg:row-start-1 lg:row-end-3 lg:items-center ${
                      feature.layout === 'right'
                        ? 'lg:col-start-17 lg:col-end-25 lg:pr-g0.25 lg:pl-g3'
                        : 'lg:col-start-1 lg:col-end-9 lg:pl-g0.25 lg:pr-g3'
                    }`}
                  >
                    <div className={`w-full max-w-prose ${feature.layout === 'right' ? 'lg:justify-self-end' : 'lg:justify-self-start'}`}>
                      <div className="type-base">
                        <h3 className="type-base md:type-md text-pretty">{feature.title}</h3>
                        <div className="type-base md:type-md text-theme-text-sec text-pretty">
                          {feature.description}
                        </div>
                      </div>
                      <div className="mt-v8/12">
                        <span className="btn-tertiary">{feature.cta}</span>
                      </div>
                    </div>
                  </div>
                  {/* Media column */}
                  <div
                    className={`max-lg:mt-g1.75 col-span-full row-start-2 row-end-3 grid cursor-default items-end lg:row-start-1 lg:row-end-3 lg:items-center ${
                      feature.layout === 'right'
                        ? 'lg:col-start-1 lg:col-end-17'
                        : 'lg:col-start-9 lg:col-end-25'
                    }`}
                  />
                </a>
                {/* Overlay grid for media placeholder */}
                <div className="grid-cursor p-g1.75 col-span-full row-span-full gap-y-0 max-lg:grid-rows-subgrid pointer-events-none">
                  <div
                    className={`col-span-full row-start-1 row-end-2 grid lg:row-start-1 lg:row-end-2 lg:items-center ${
                      feature.layout === 'right'
                        ? 'lg:col-start-17 lg:col-end-25 lg:pr-g0.25 lg:pl-g3'
                        : 'lg:col-start-1 lg:col-end-9 lg:pl-g0.25 lg:pr-g3'
                    }`}
                  />
                  <div
                    className={`max-lg:pt-v1 col-span-full row-start-2 row-end-3 grid cursor-default items-end lg:row-start-2 lg:row-end-3 lg:items-center ${
                      feature.layout === 'right'
                        ? 'lg:col-start-1 lg:col-end-17'
                        : 'lg:col-start-9 lg:col-end-25'
                    }`}
                  >
                    <div className="media-border-container relative aspect-[4/3] bg-theme-card" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </section>

      {/* ── 4. "The new way to run Linux" + Testimonials ── */}
      <section className="section bg-theme-bg text-theme-text overflow-hidden">
        <div className="container">
          <div className="text-center mx-auto mb-v2.5 max-w-prose-medium-wide">
            <h2 className="type-lg text-balance mx-auto">Lightweight Linux, done right.</h2>
          </div>
        </div>
        <div className="container">
          <div className="grid grid-cols-1 gap-g1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {testimonials.map((t) => (
              <div key={t.author} className={t.hidden ? 'hidden md:block' : ''}>
                <div className="card relative flex h-full min-h-[180px] w-full shrink-0 flex-col">
                  <figure className="flex h-full flex-col">
                    <blockquote className="grow overflow-hidden">
                      <p className="type-base line-clamp-4 whitespace-pre-wrap md:line-clamp-5">
                        {t.quote}
                      </p>
                    </blockquote>
                    <div className="mt-v2 flex items-center gap-g1">
                      <figcaption>
                        <div className="type-sm">
                          {t.author}{' '}
                          <span className="type-sm text-theme-text-sec block">{t.role}</span>
                        </div>
                      </figcaption>
                    </div>
                  </figure>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. What's New (feature grid cards) ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container my-v2">
          <div className="text-left mb-v1 max-w-prose-narrow">
            <h2 className="type-md-lg text-balance">What&rsquo;s new in OxyOS 1.0</h2>
          </div>
          <div className="grid gap-g1 grid-cols-1 xl:grid-cols-3 items-stretch">
            {newFeatures.map((f) => (
              <div key={f.title} className="h-full">
                <div className="card flex h-full grow-1 flex-col">
                  <div className="type-base max-w-prose flex grow flex-col">
                    <div>
                      <h3>{f.title}</h3>
                      <div className="text-theme-text-sec text-pretty">{f.description}</div>
                    </div>
                    {f.link && (
                      <div className="mt-auto pt-v8/12">
                        <a
                          className="btn-tertiary"
                          href={f.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {f.link.label}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Screenshots ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="gap-g1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {screenshots.map((src, i) => (
              <div key={src} className="flex flex-col">
                <div className="card stack pb-g2 grow-1">
                  <div className="media-border-container relative bg-theme-card overflow-hidden">
                    <img alt={`OxyOS screenshot ${i + 1}`} src={src} className="w-full h-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Supported Hardware (large card) ── */}
      <section className="section bg-theme-bg text-theme-text" id="hardware">
        <div className="container mb-v4">
          <div className="grid grid-rows-[auto_1fr]">
            <div className="card card--large grid-cursor col-span-full row-span-full gap-y-0 max-lg:grid-rows-subgrid">
              <div className="col-span-full row-start-1 row-end-2 grid lg:row-start-1 lg:row-end-3 lg:items-center lg:col-start-1 lg:col-end-9 lg:pl-g0.25 lg:pr-g3">
                <div className="w-full max-w-prose lg:justify-self-start">
                  <div className="type-base">
                    <h3 className="type-base md:type-md text-pretty">
                      Runs everywhere. From decade-old ThinkPads to the latest Snapdragon X laptops.
                    </h3>
                  </div>
                  <div className="mt-v1">
                    <div className="flex justify-start gap-x-g1 items-center flex-wrap">
                      <a className="btn" href="https://downloads.os.oxy.so/oxyos-1.8.2-amd64.iso">
                        Download amd64
                        <div aria-hidden="true" className="btn-icon">
                          <span aria-hidden="true">&#x2913;</span>
                        </div>
                      </a>
                      <a className="btn btn--secondary" href="https://downloads.os.oxy.so/oxyos-1.8.2-arm64.iso">
                        Download arm64
                        <div aria-hidden="true" className="btn-icon">
                          <span aria-hidden="true">&#x2913;</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="max-lg:mt-g1.75 col-span-full row-start-2 row-end-3 grid cursor-default items-end lg:row-start-1 lg:row-end-3 lg:items-center lg:col-start-9 lg:col-end-25" />
            </div>
            <div className="grid-cursor p-g1.75 col-span-full row-span-full gap-y-0 max-lg:grid-rows-subgrid pointer-events-none">
              <div className="col-span-full row-start-1 row-end-2 grid lg:row-start-1 lg:row-end-2 lg:items-center lg:col-start-1 lg:col-end-9 lg:pl-g0.25 lg:pr-g3" />
              <div className="max-lg:pt-v1 col-span-full row-start-2 row-end-3 grid cursor-default items-end lg:row-start-2 lg:row-end-3 lg:items-center lg:col-start-9 lg:col-end-25">
                <div className="media-border-container relative aspect-video bg-theme-card" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Hardware Specs (3-col grid) ── */}
      <section className="section bg-theme-card-hex text-theme-text">
        <div className="container">
          <div className="grid gap-g1 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-stretch">
            {hardwareCards.map((card) => (
              <div key={card.title} className="h-full">
                <div className="card flex h-full grow-1 flex-col">
                  <div className="type-base max-w-prose flex grow flex-col">
                    <div>
                      <h3>{card.title}</h3>
                      <div className="text-theme-text-sec text-pretty">{card.description}</div>
                    </div>
                    <ul className="mt-v8/12 space-y-1 text-theme-text-sec">
                      {card.specs.map((spec) => (
                        <li key={spec} className="type-sm">{spec}</li>
                      ))}
                    </ul>
                    {card.download && (
                      <div className="mt-auto pt-v8/12">
                        <a className="btn" href={card.download.href}>
                          {card.download.label}
                          <div aria-hidden="true" className="btn-icon">
                            <span aria-hidden="true">&#x2913;</span>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FAQ ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="grid-cursor gap-0">
            <div className="col-span-full md:col-start-1 md:col-end-7 lg:col-start-1 lg:col-end-9 xl:col-start-1 xl:col-end-7">
              <h2 className="type-md-lg text-balance mb-v1">Frequently asked questions</h2>
              <p className="type-base text-theme-text-sec mb-v1 lg:mb-0">
                Can&apos;t find the answer you&apos;re looking for? Reach out on our{' '}
                <a href="https://github.com/OxyHQ/OxyOS/issues" className="btn-tertiary">
                  GitHub issues
                </a>.
              </p>
            </div>
            <div className="col-span-full md:col-start-7 md:col-end-25 lg:col-start-9 lg:col-end-25 xl:col-start-7 xl:col-end-19">
              {faqItems.map((item) => (
                <div key={item.question} className="mb-g1">
                  <div className="card card--text">
                    <div className="type-base text-theme-text mb-v8/12">{item.question}</div>
                    <div className="type-base text-theme-text-sec">
                      {item.answer}
                      {item.code && (
                        <code className="mx-1 rounded bg-theme-card px-1.5 py-0.5 text-sm text-theme-text">
                          {item.code}
                        </code>
                      )}
                      {item.answerEnd && ` ${item.answerEnd}`}
                      {item.link && (
                        <>
                          {' '}
                          <a
                            href={item.link.href}
                            className="btn-tertiary"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.link.label}
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Recent Highlights ── */}
      <section className="section bg-theme-card-hex text-theme-text">
        <div className="container">
          <div className="grid-cursor gap-0">
            <div className="col-span-full md:col-start-1 md:col-end-7 lg:col-start-1 lg:col-end-9 xl:col-start-1 xl:col-end-7">
              <h2 className="type-base text-theme-text mb-v1 sticky top-0 lg:mb-0">Recent highlights</h2>
            </div>
            <div className="col-span-full md:col-start-7 md:col-end-25 lg:col-start-9 lg:col-end-25 xl:col-start-7 xl:col-end-19">
              {highlights.map((h, i) => (
                <article key={h.title} className={`flex grow-1 flex-col${i < highlights.length - 1 ? ' mb-g1' : ''}`}>
                  <a className="card card--text grow-1" href={h.href}>
                    <div className="flex flex-col">
                      <div className="grow-1">
                        <p className="type-base text-theme-text text-pretty">{h.title}</p>
                        <p className="type-base text-theme-text-sec text-pretty">{h.description}</p>
                      </div>
                      <div className="mt-v1 text-theme-text-sec flex shrink-0 items-center">
                        <span className="capitalize">{h.category}&nbsp;&middot;&nbsp;</span>
                        <time className="type-base">{h.date}</time>
                      </div>
                    </div>
                  </a>
                </article>
              ))}
              <a className="btn-text mt-v1 inline-flex" href="https://github.com/OxyHQ/OxyOS/releases">
                View all releases &rarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. CTA ── */}
      <section className="section bg-theme-bg text-theme-text section--headline">
        <div className="container">
          <div className="text-center mx-auto max-w-prose-medium-wide">
            <h2 className="type-xl sm:type-2xl text-balance mx-auto mb-v1">
              Try OxyOS now.
            </h2>
            <div className="flex justify-center gap-x-g1 items-center flex-wrap">
              <div>
                <div className="hidden items-center md:flex">
                  <a className="btn" href="https://downloads.os.oxy.so/oxyos-1.8.2-amd64.iso">
                    Download ISO (amd64)
                    <div aria-hidden="true" className="btn-icon">
                      <span aria-hidden="true">&#x2913;</span>
                    </div>
                  </a>
                </div>
                <div className="flex items-center md:hidden">
                  <a className="btn" href="https://github.com/OxyHQ/OxyOS/releases">
                    All Downloads
                    <div aria-hidden="true" className="btn-icon">
                      <span aria-hidden="true">&rarr;</span>
                    </div>
                  </a>
                </div>
              </div>
              <div className="hidden md:block">
                <a className="btn btn--secondary" href="https://downloads.os.oxy.so/oxyos-1.8.2-arm64.iso">
                  ARM64 ISO
                  <div aria-hidden="true" className="btn-icon">
                    <span aria-hidden="true">&rarr;</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
