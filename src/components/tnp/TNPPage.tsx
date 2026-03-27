import { useState } from 'react'
import Button from '../ui/Button'

const tldCards = [
  {
    tld: '.ox',
    title: 'Short, sharp, Oxy-native',
    description: 'The default namespace for everything on TNP. Clean two-letter domains that belong to you.',
  },
  {
    tld: '.app',
    title: 'For web apps and developer projects',
    description: 'Ship your side project, SaaS tool, or API on a namespace built for builders.',
  },
  {
    tld: '.com',
    title: 'The classic, now on TNP',
    description: 'The domain everyone knows, available fresh in the TNP namespace. No squatters, no markup.',
  },
  {
    tld: '.???',
    title: 'Propose your own TLD',
    description: 'Think the world needs .dev, .music, or .pizza? Propose it. The community votes.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Install TNP',
    description: 'One command. It configures your system DNS to resolve TNP domains alongside the regular internet.',
    code: 'curl -fsSL https://get.tnp.network | sh',
  },
  {
    number: '02',
    title: 'Register your domain',
    description: 'Pick a name, pick a TLD, and register it at tnp.network. Linked to your Oxy account.',
  },
  {
    number: '03',
    title: 'It just works',
    description: 'Your domain resolves natively on any device running TNP. No browser extensions, no proxies, no workarounds.',
  },
]

const features = [
  {
    title: 'Own your namespace',
    description: 'TNP is not subject to ICANN rules, registrar fees, or domain squatting. You register once and it is yours.',
  },
  {
    title: 'Linked to your Oxy account',
    description: 'Your domains are tied to the identity you already own. One login, one place to manage everything.',
  },
  {
    title: 'Open by design',
    description: 'The TNP client is open source. The infrastructure is transparent. You can see exactly what it does.',
  },
  {
    title: 'DNS only, nothing else',
    description: 'TNP is not a VPN. It does not route your traffic. It only resolves names. Everything else stays the same.',
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-3 shrink-0 cursor-pointer rounded-lg border border-transparent px-2.5 py-1 text-xs font-medium text-theme-text-sec transition-colors hover:bg-[rgba(16,185,129,0.08)] hover:text-theme-text"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function TNPContent() {
  return (
    <div className="cursor-theme tnp-theme">
      {/* ── 1. Hero ── */}
      <section className="section section--headline bg-theme-bg text-theme-text">
        <div className="container">
          <div className="text-center mx-auto max-w-prose-medium-wide">
            <div className="mono-tag mb-v1 flex items-center justify-center gap-2 text-sm">
              <span>[</span> <span>TNP</span> <span>]</span>
            </div>
            <p className="type-base text-theme-text-sec mb-v8/12">The Network Protocol</p>
            <h1 className="type-xl sm:type-2xl text-balance mb-v1 gradient-text">
              Your internet. Your rules.
            </h1>
            <p className="type-base text-theme-text-sec text-pretty mb-v1">
              TNP is an alternative internet namespace controlled by Oxy. Register domains on TLDs
              that no one else can offer. Install once, and every TNP domain resolves natively on your device.
            </p>
            <div className="flex justify-center gap-x-g1 items-center flex-wrap mb-v1">
              <Button href="https://tnp.network/register" target="_blank" rel="noopener noreferrer">
                Register a Domain
              </Button>
              <Button variant="outline" href="/tnp/install">
                Install TNP
              </Button>
            </div>
            <div className="code-block flex items-center justify-between text-left">
              <code>curl -fsSL https://get.tnp.network | sh</code>
              <CopyButton text="curl -fsSL https://get.tnp.network | sh" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. What is TNP ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="grid-cursor gap-0">
            <div className="col-span-full md:col-start-1 md:col-end-10 lg:col-start-1 lg:col-end-9">
              <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
                <span>[</span> <span>About</span> <span>]</span>
              </div>
              <h2 className="type-md-lg text-balance">
                A parallel internet, built on DNS
              </h2>
            </div>
            <div className="col-span-full md:col-start-10 md:col-end-25 lg:col-start-10 lg:col-end-25 mt-v1 md:mt-0">
              <div className="type-base text-theme-text-sec space-y-4 max-w-prose">
                <p>
                  TNP is an alternative internet layer that runs on top of the regular internet. It is
                  a parallel namespace: a new set of domain names that only resolve for people running TNP.
                </p>
                <p>
                  Oxy controls the root. That means TNP can offer TLDs that ICANN never will,
                  with registration rules that actually make sense. No annual renewal gouging.
                  No domain squatting. No WHOIS privacy fees.
                </p>
                <p>
                  TNP is DNS-only. It does not tunnel your traffic, it does not act as a VPN, and it
                  does not touch anything except name resolution. Install it once, and every TNP domain
                  works system-wide: browsers, CLI tools, APIs, everything.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TLDs ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>Domains</span> <span>]</span>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-v2">
            <h2 className="type-md-lg text-balance max-w-prose-narrow">
              TLDs available at launch
            </h2>
          </div>
          <div className="grid gap-0 lg:grid-cols-4 lg:-space-x-px">
            {tldCards.map((card) => (
              <div
                key={card.tld}
                className="group relative flex h-full flex-col space-y-4 px-0 py-10 lg:p-8 border-theme-border-02 border-t lg:border-l lg:border-t-0 first:border-t-0 first:lg:border-l-0"
              >
                {/* Corner dots (visible on hover, desktop only) */}
                <div className="pointer-events-none absolute inset-0 isolate z-10 border border-[rgba(16,185,129,0.15)] opacity-0 group-hover:opacity-100 hidden lg:block">
                  <div className="bg-[#10b981] absolute -left-1 -top-1 z-10 size-2 -translate-x-px -translate-y-px" />
                  <div className="bg-[#10b981] absolute -right-1 -top-1 z-10 size-2 -translate-y-px translate-x-px" />
                  <div className="bg-[#10b981] absolute -bottom-1 -left-1 z-10 size-2 -translate-x-px translate-y-px" />
                  <div className="bg-[#10b981] absolute -bottom-1 -right-1 z-10 size-2 translate-x-px translate-y-px" />
                </div>
                <div className="max-w-sm grow">
                  <h3 className="type-md-lg gradient-text">{card.tld}</h3>
                  <p className="type-base text-theme-text mt-2">{card.title}</p>
                  <p className="type-base text-theme-text-sec mt-2">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. How it works ── */}
      <section className="section bg-theme-card-hex text-theme-text">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>How it works</span> <span>]</span>
          </div>
          <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">
            Three steps. No configuration.
          </h2>
          <div className="grid gap-g1 grid-cols-1 lg:grid-cols-3 items-stretch">
            {steps.map((step) => (
              <div key={step.number} className="h-full">
                <div className="card flex h-full grow-1 flex-col">
                  <div className="type-base max-w-prose flex grow flex-col">
                    <span className="mono-tag text-[#10b981] text-sm mb-v8/12">{step.number}</span>
                    <h3 className="type-base md:type-md">{step.title}</h3>
                    <p className="text-theme-text-sec text-pretty mt-2">{step.description}</p>
                    {step.code && (
                      <div className="code-block mt-v8/12 flex items-center justify-between">
                        <code className="text-xs">{step.code}</code>
                        <CopyButton text={step.code} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Why TNP ── */}
      <section className="section bg-theme-bg text-theme-text">
        <div className="container">
          <div className="mono-tag mb-v1 flex items-center gap-2 text-sm">
            <span>[</span> <span>Why TNP</span> <span>]</span>
          </div>
          <h2 className="type-md-lg text-balance mb-v2 max-w-prose-narrow">
            A namespace you actually control
          </h2>
          <div className="grid gap-g1 grid-cols-1 md:grid-cols-2 items-stretch">
            {features.map((feature) => (
              <div key={feature.title} className="h-full">
                <div className="card flex h-full grow-1 flex-col">
                  <div className="type-base max-w-prose flex grow flex-col">
                    <h3>{feature.title}</h3>
                    <p className="text-theme-text-sec text-pretty mt-2">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Register CTA ── */}
      <section className="section section--headline bg-theme-bg text-theme-text">
        <div className="container">
          <div className="relative flex items-center justify-center py-6">
            <div className="absolute inset-x-0 -top-16 h-px bg-gradient-to-r from-transparent via-[#10b981] to-transparent opacity-40 sm:-top-32" />
            <div className="relative flex max-w-lg flex-col items-center space-y-8 text-center">
              <h2 className="type-xl sm:type-2xl text-balance gradient-text">
                Claim your namespace.
              </h2>
              <p className="type-base text-theme-text-sec">
                Registration is free and requires an Oxy account. Pick your domain, set your records,
                and you are live on the TNP network.
              </p>
              <div className="flex gap-x-g1 items-center flex-wrap justify-center">
                <Button href="https://tnp.network/register" target="_blank" rel="noopener noreferrer">
                  Register a Domain
                </Button>
                <Button variant="outline" href="/tnp/install">
                  Install TNP
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
