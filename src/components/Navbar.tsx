"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { IMAGES } from "@/lib/data";

const navLinks = [
  { label: "Who we are", href: "/company" },
  { label: "Our Technologies", href: "/products" },
  { label: "Our Company", href: "/company" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center">
        {/* Left: Nav links */}
        <nav className="hidden md:flex items-center gap-8 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Center: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={IMAGES.oxyLogo}
            alt="Oxy"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-bold tracking-tight uppercase">Oxy</span>
        </Link>

        {/* Right: CTA */}
        <div className="hidden md:flex items-center justify-end flex-1">
          <Link
            href="/join"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black text-xs uppercase tracking-wider font-medium hover:bg-white/90 transition-colors"
          >
            Get involved
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white ml-auto"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-white/5 px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block text-sm uppercase tracking-wider text-white/60 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/join"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black text-xs uppercase tracking-wider font-medium"
            onClick={() => setMobileOpen(false)}
          >
            Get involved
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </header>
  );
}
