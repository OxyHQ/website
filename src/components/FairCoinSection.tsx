"use client";

import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/data";

export default function FairCoinSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-[#111111] border border-white/5">
          {/* FairCoin header banner */}
          <div className="carousel-mask overflow-hidden py-6 border-b border-white/5">
            <div className="flex gap-8 animate-scroll-left" style={{ width: "max-content" }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-48 h-8 relative opacity-30">
                  <Image
                    src={IMAGES.fairCoinBanner}
                    alt="FairCoin"
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-2">FairCoin Today</h3>

            <div className="flex gap-4 mt-4 mb-8">
              <Link
                href="https://fairco.in/buy"
                className="px-5 py-2 rounded-full bg-green-500 text-black text-sm font-medium hover:bg-green-400 transition-colors"
              >
                Buy
              </Link>
              <Link
                href="https://fairco.in/"
                className="px-5 py-2 rounded-full border border-white/20 text-sm font-medium hover:border-white/40 transition-colors"
              >
                Learn More
              </Link>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Current Blocks", value: "0", unit: "Blocks" },
                { label: "Network", value: "0", unit: "(KH/s)" },
                { label: "Active Peers", value: "0", unit: "Active" },
                { label: "Difficulty", value: "0.000", unit: "" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-[#0a0a0a] border border-white/5 p-4"
                >
                  <p className="text-xs text-white/40">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  {stat.unit && (
                    <p className="text-xs text-white/30 mt-1">{stat.unit}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Dashboard preview images */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <Image
                  src={IMAGES.fairCoinDashboard}
                  alt="FairCoin Dashboard"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <Image
                  src={IMAGES.fairCoinSecondary}
                  alt="FairCoin Analytics"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
