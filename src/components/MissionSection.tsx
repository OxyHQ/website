import Link from "next/link";

export default function MissionSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto text-center space-y-6">
        <h2 className="text-3xl md:text-5xl font-bold leading-tight">
          Build for everyone, not just yourself.
        </h2>
        <p className="text-white/50 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          Oxy exists because we believe technology should serve humanity, not exploit it.
          Through community-driven projects and open-source tools, we prove that helping
          people and building sustainable systems aren&apos;t competing goals. They&apos;re the same mission.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
          <Link
            href="/newsroom"
            className="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4"
          >
            Oxy Newsroom ↗
          </Link>
          <Link
            href="/developers"
            className="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4"
          >
            Search documentation ↗
          </Link>
          <Link
            href="/developers"
            className="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4"
          >
            Dig into the code ↗
          </Link>
          <Link
            href="/company#team"
            className="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4"
          >
            Meet the Oxy team ↗
          </Link>
        </div>
      </div>
    </section>
  );
}
