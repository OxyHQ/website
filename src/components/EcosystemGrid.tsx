import Image from "next/image";
import Link from "next/link";
import { ECOSYSTEM_ITEMS } from "@/lib/data";

export default function EcosystemGrid() {
  const row1 = ECOSYSTEM_ITEMS.slice(0, 6);
  const row2 = ECOSYSTEM_ITEMS.slice(6);

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-[#0a0a0a]">
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-serif text-3xl md:text-4xl uppercase tracking-wide text-center mb-16"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Explore the Oxy Ecosystem
        </h2>

        <div className="space-y-4">
          {/* Row 1 */}
          <div className="flex justify-center gap-4">
            {row1.map((item, i) => {
              const isExternal = item.href.startsWith("http");
              const Wrapper = isExternal ? "a" : Link;
              const extraProps = isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {};

              return (
                <Wrapper
                  key={`eco-r1-${i}`}
                  href={item.href}
                  className="group relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-[#161616] hover:ring-2 hover:ring-white/20 transition-all flex-shrink-0"
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

          {/* Row 2 */}
          <div className="flex justify-center gap-4">
            {row2.map((item, i) => {
              const isExternal = item.href.startsWith("http");
              const Wrapper = isExternal ? "a" : Link;
              const extraProps = isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {};

              return (
                <Wrapper
                  key={`eco-r2-${i}`}
                  href={item.href}
                  className="group relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-[#161616] hover:ring-2 hover:ring-white/20 transition-all flex-shrink-0"
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
      </div>
    </section>
  );
}
