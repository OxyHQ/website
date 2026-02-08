"use client";

import Image from "next/image";
import { IMAGES } from "@/lib/data";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={IMAGES.hero}
          alt="Person sitting on grass using phone"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a]/60 to-[#0a0a0a]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
          Creating a future where technology empowers individuals to live connected, fulfilling, and sustainable lives.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-white/50 max-w-2xl mx-auto">
          Built by people who believe in change. Ethical, open, and deeply human.
        </p>
      </div>
    </section>
  );
}
