"use client";

import Image from "next/image";
import Link from "next/link";

interface CarouselItem {
  title: string;
  image: string;
  href: string;
}

interface NewsCarouselProps {
  items: CarouselItem[];
  direction?: "left" | "right";
}

export default function NewsCarousel({ items, direction = "left" }: NewsCarouselProps) {
  const doubled = [...items, ...items, ...items];
  const animClass = direction === "left" ? "animate-scroll-left" : "animate-scroll-right";

  return (
    <div className="carousel-mask overflow-hidden">
      <div className={`flex gap-4 ${animClass}`} style={{ width: "max-content" }}>
        {doubled.map((item, i) => (
          <Link
            key={`${item.href}-${i}`}
            href={item.href}
            className="group flex-shrink-0 w-72 md:w-80"
          >
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#161616]">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <h4 className="mt-3 text-sm font-medium text-white/80 group-hover:text-white transition-colors line-clamp-2">
              {item.title}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  );
}
