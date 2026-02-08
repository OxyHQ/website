"use client";

import Image from "next/image";
import { VALUES } from "@/lib/data";

export default function ValuesCarousel() {
  const tripled = [...VALUES, ...VALUES, ...VALUES, ...VALUES];

  return (
    <section className="py-20 space-y-6">
      {/* Three rows scrolling in different directions */}
      {[0, 1, 2].map((row) => (
        <div key={row} className="carousel-mask overflow-hidden">
          <div
            className={`flex gap-5 ${row % 2 === 0 ? "animate-scroll-left" : "animate-scroll-right"}`}
            style={{ width: "max-content" }}
          >
            {tripled.map((value, i) => (
              <div
                key={`${value.title}-${row}-${i}`}
                className="flex-shrink-0 w-72 md:w-80 rounded-2xl overflow-hidden bg-[#161616] group"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={value.image}
                    alt={value.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-lg font-semibold">{value.title}</h3>
                    <p className="mt-2 text-sm text-white/60 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
