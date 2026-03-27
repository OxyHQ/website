import { useState } from 'react'
import Button from '../ui/Button'

type Platform = 'macos' | 'linux' | 'windows'

const platforms: { id: Platform; label: string }[] = [
  { id: 'macos', label: 'macOS' },
  { id: 'linux', label: 'Linux' },
  { id: 'windows', label: 'Windows' },
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

export default function TNPInstallContent() {
  const [platform, setPlatform] = useState<Platform>('macos')
  const installCommand = 'curl -fsSL https://get.tnp.network | sh'

  return (
    <div className="cursor-theme tnp-theme">
      {/* ── Hero ── */}
      <section className="section section--headline bg-theme-bg text-theme-text">
        <div className="container">
          <div className="text-center mx-auto max-w-prose-medium-wide">
            <div className="mono-tag mb-v1 flex items-center justify-center gap-2 text-sm">
              <span>[</span> <span>Install</span> <span>]</span>
            </div>
            <h1 className="type-xl sm:type-2xl text-balance mb-v1 gradient-text">
              Install TNP
            </h1>
            <p className="type-base text-theme-text-sec text-pretty mb-v1">
              One command. Your device starts resolving TNP domains immediately.
            </p>
          </div>
        </div>
      </section>

      {/* ── Install command ── */}
      <section className="section bg-theme-bg text-theme-text pt-0">
        <div className="container max-w-prose-medium-wide mx-auto">
          <div className="code-block flex items-center justify-between text-left mb-v2">
            <code>{installCommand}</code>
            <CopyButton text={installCommand} />
          </div>

          {/* ── Platform tabs ── */}
          <div className="mb-v1">
            <div className="flex gap-2 mb-v1">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    platform === p.id
                      ? 'bg-[#10b981] text-white'
                      : 'border border-[rgba(16,185,129,0.25)] text-theme-text-sec hover:bg-[rgba(16,185,129,0.08)] hover:text-theme-text'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {platform === 'macos' && (
              <div className="card">
                <div className="type-base space-y-4">
                  <h3>macOS</h3>
                  <p className="text-theme-text-sec">
                    The installer configures your system DNS resolver to query TNP nameservers for
                    TNP domains, while forwarding everything else to your default resolver.
                  </p>
                  <div className="space-y-2 text-theme-text-sec">
                    <p className="type-sm">Requirements:</p>
                    <ul className="type-sm list-disc pl-5 space-y-1">
                      <li>macOS 12 Monterey or later</li>
                      <li>Admin password (the installer sets up a resolver config)</li>
                    </ul>
                  </div>
                  <div className="space-y-2 text-theme-text-sec">
                    <p className="type-sm">What the installer does:</p>
                    <ul className="type-sm list-disc pl-5 space-y-1">
                      <li>Downloads the TNP resolver binary</li>
                      <li>Creates a resolver entry in <code className="rounded bg-theme-card px-1.5 py-0.5 text-xs text-theme-text">/etc/resolver/</code> for each TNP TLD</li>
                      <li>Starts a lightweight background service via launchd</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {platform === 'linux' && (
              <div className="card">
                <div className="type-base space-y-4">
                  <h3>Linux</h3>
                  <p className="text-theme-text-sec">
                    Works with systemd-resolved, NetworkManager, and standalone resolv.conf setups.
                    The installer detects your DNS configuration automatically.
                  </p>
                  <div className="space-y-2 text-theme-text-sec">
                    <p className="type-sm">Requirements:</p>
                    <ul className="type-sm list-disc pl-5 space-y-1">
                      <li>Any modern Linux distribution (Ubuntu, Fedora, Arch, Debian, etc.)</li>
                      <li>sudo access</li>
                    </ul>
                  </div>
                  <div className="space-y-2 text-theme-text-sec">
                    <p className="type-sm">What the installer does:</p>
                    <ul className="type-sm list-disc pl-5 space-y-1">
                      <li>Downloads the TNP resolver binary</li>
                      <li>Configures systemd-resolved split DNS (or adds entries to resolv.conf)</li>
                      <li>Enables a systemd service for the TNP resolver</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {platform === 'windows' && (
              <div className="card">
                <div className="type-base space-y-4">
                  <h3>Windows</h3>
                  <p className="text-theme-text-sec">
                    Windows support is coming soon. The installer will configure the Windows DNS
                    client to resolve TNP domains natively.
                  </p>
                  <div className="space-y-2 text-theme-text-sec">
                    <p className="type-sm">
                      Want early access? Join the waitlist at{' '}
                      <a
                        href="https://tnp.network"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#34d399] hover:text-[#6ee7b7] transition-colors"
                      >
                        tnp.network
                      </a>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── What happens ── */}
          <div className="mt-v2">
            <h2 className="type-md-lg text-balance mb-v1">What happens when you install TNP</h2>
            <div className="type-base text-theme-text-sec space-y-4 max-w-prose">
              <p>
                TNP runs a small local DNS resolver on your machine. When you visit a TNP domain
                (like <code className="rounded bg-theme-card px-1.5 py-0.5 text-xs text-theme-text">nate.ox</code>),
                the resolver queries TNP nameservers and returns the right IP address. For all other
                domains, it forwards the query to your normal DNS provider.
              </p>
              <p>
                There is no VPN. There is no traffic routing. There is no proxy. TNP only touches
                DNS resolution. Your traffic goes directly to the destination, just like it always does.
              </p>
              <p>
                To uninstall, run <code className="rounded bg-theme-card px-1.5 py-0.5 text-xs text-theme-text">tnp uninstall</code> and
                everything is cleaned up.
              </p>
            </div>
          </div>

          {/* ── Back CTA ── */}
          <div className="mt-v2 flex gap-x-g1 items-center flex-wrap">
            <Button href="/tnp">
              Back to TNP
            </Button>
            <Button variant="outline" href="https://tnp.network/register" target="_blank" rel="noopener noreferrer">
              Register a Domain
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
