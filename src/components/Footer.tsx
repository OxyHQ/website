import Link from "next/link";
import Image from "next/image";
import { FOOTER_LINKS, CORPORATE_LINKS, IMAGES } from "@/lib/data";

export default function Footer() {
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
        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
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

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium">The Oxy Collective, Inc.</p>
            <p className="text-xs text-white/40 mt-1">
              Our mission is to fuel innovation with purpose, providing the tools and support
              to build tools that solve global challenges.
            </p>
            <p className="text-xs text-white/30 mt-2">
              Made with 💚 in the 🌎 by Oxy.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
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
    </footer>
  );
}
