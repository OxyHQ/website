import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const missionLinks = [
  { label: "Oxy Newsroom", href: "/newsroom" },
  { label: "Search documentation", href: "/developers" },
  { label: "Dig into the code", href: "/developers" },
  { label: "Meet the Oxy team", href: "/company#team" },
];

export default function MissionSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
        {/* Left column: heading and description */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Build for everyone, not just yourself.
          </h2>
          <p className="text-white/50 text-base md:text-lg leading-relaxed">
            Oxy exists because we believe technology should serve humanity, not exploit it.
            Through community-driven projects and open-source tools, we prove that helping
            people and building sustainable systems aren&apos;t competing goals. They&apos;re the same mission.
          </p>
        </div>

        {/* Right column: link list */}
        <div className="flex flex-col justify-center">
          {missionLinks.map((link, i) => (
            <Link
              key={link.label}
              href={link.href}
              className={`group flex items-center justify-between py-5 text-white/70 hover:text-white transition-colors ${
                i !== missionLinks.length - 1 ? "border-b border-white/10" : ""
              }`}
            >
              <span className="text-sm md:text-base">{link.label}</span>
              <ArrowUpRight
                size={18}
                className="text-white/30 group-hover:text-white transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
