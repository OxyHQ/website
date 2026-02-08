import Link from "next/link";
import Image from "next/image";
import { FOOTER_LINKS, CORPORATE_LINKS, IMAGES } from "@/lib/data";

const socialLinks = [
  { label: "Telegram", href: "https://t.me/oxyhq", icon: "TG" },
  { label: "Instagram", href: "https://instagram.com/oxyhq", icon: "IG" },
  { label: "Reddit", href: "https://reddit.com/r/oxyhq", icon: "RD" },
  { label: "LinkedIn", href: "https://linkedin.com/company/oxyhq", icon: "LI" },
  { label: "X", href: "https://x.com/oxyhq", icon: "X" },
  { label: "GitHub", href: "https://github.com/oxyhq", icon: "GH" },
];

export default function Footer() {
  const mainCategories = Object.entries(FOOTER_LINKS).slice(0, 4);

  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a]">
      {/* Footer banner */}
      <div className="relative w-full h-32 md:h-48 overflow-hidden opacity-30">
        <Image
          src={IMAGES.footerBanner}
          alt="Oxy ecosystem banner"
          fill
          className="object-cover"
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Social & Language */}
          <div className="md:col-span-3 space-y-6">
            <div className="flex items-center gap-2">
              <Image
                src={IMAGES.oxyLogo}
                alt="Oxy"
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-lg font-bold uppercase">Oxy</span>
            </div>

            {/* Social icons */}
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/50 hover:text-white hover:border-white/30 transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            <div className="text-xs text-white/30">
              <button className="hover:text-white/50 transition-colors">
                English ▾
              </button>
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {mainCategories.map(([section, links]) => (
              <div key={section}>
                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                  {section}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/50 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Corporate info */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Corporate Information
            </h4>
            <div>
              <p className="text-sm font-medium">The Oxy Collective, Inc.</p>
              <p className="text-xs text-white/40 mt-2 leading-relaxed">
                Our mission is to fuel innovation with purpose, providing the tools and support
                to build tools that solve global challenges.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {CORPORATE_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            Made with 💚 in the 🌎 by Oxy.
          </p>
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} The Oxy Collective, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
