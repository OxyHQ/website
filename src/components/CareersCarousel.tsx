"use client";

import Link from "next/link";
import { CAREERS } from "@/lib/data";

export default function CareersCarousel() {
  const tripled = [...CAREERS, ...CAREERS, ...CAREERS, ...CAREERS];

  return (
    <div className="carousel-mask overflow-hidden">
      <div className="flex gap-4 animate-scroll-left" style={{ width: "max-content" }}>
        {tripled.map((job, i) => (
          <Link
            key={`${job.href}-${i}`}
            href={job.href}
            className="flex-shrink-0 w-64 rounded-xl bg-[#161616] border border-white/5 p-5 hover:border-white/15 transition-colors group"
          >
            <span className="text-xs text-white/40 uppercase tracking-wider">Careers</span>
            <h4 className="mt-2 text-sm font-medium text-white/80 group-hover:text-white transition-colors">
              {job.title}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  );
}
