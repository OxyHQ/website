import Image from "next/image";
import Link from "next/link";
import { ECOSYSTEM_ITEMS } from "@/lib/data";

export default function EcosystemGrid() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Explore the Oxy Ecosystem
        </h2>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {ECOSYSTEM_ITEMS.map((item, i) => {
            const isExternal = item.href.startsWith("http");
            const Wrapper = isExternal ? "a" : Link;
            const extraProps = isExternal
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {};

            return (
              <Wrapper
                key={`eco-${i}`}
                href={item.href}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-[#161616] hover:ring-2 hover:ring-white/20 transition-all"
                {...extraProps}
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
