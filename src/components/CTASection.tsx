import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/data";

export default function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            An independent ecosystem of ethical technology. Radically transparent, fiercely human.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed">
            No ads. No data selling. No venture capital strings. Just purpose-driven AI tools
            designed for real-world impact.
          </p>
          <div className="flex gap-4 pt-2">
            <Link
              href="/newsroom"
              className="inline-flex items-center px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Newsroom
            </Link>
            <button className="inline-flex items-center px-6 py-3 rounded-full border border-white/20 text-sm font-medium text-white hover:border-white/40 transition-colors">
              For Investors
            </button>
          </div>
        </div>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
          <Image
            src={IMAGES.bottomImage}
            alt="Oxy community"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
