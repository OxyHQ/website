import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import NewsCarousel from "@/components/NewsCarousel";
import CareersCarousel from "@/components/CareersCarousel";
import FairCoinSection from "@/components/FairCoinSection";
import MissionSection from "@/components/MissionSection";
import ValuesCarousel from "@/components/ValuesCarousel";
import CTASection from "@/components/CTASection";
import EcosystemGrid from "@/components/EcosystemGrid";
import Footer from "@/components/Footer";
import { NEWS_ITEMS, FAIRCOIN_NEWS } from "@/lib/data";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />

        {/* News carousel section */}
        <section className="py-12 space-y-4">
          <NewsCarousel items={NEWS_ITEMS} direction="left" />
        </section>

        {/* Careers carousel */}
        <section className="py-8">
          <CareersCarousel />
        </section>

        {/* FairCoin section */}
        <FairCoinSection />

        {/* FairCoin news carousel */}
        <section className="py-8">
          <NewsCarousel items={FAIRCOIN_NEWS} direction="right" />
        </section>

        {/* Mission / About */}
        <MissionSection />

        {/* Values carousel rows */}
        <ValuesCarousel />

        {/* CTA section */}
        <CTASection />

        {/* Ecosystem grid */}
        <EcosystemGrid />
      </main>
      <Footer />
    </>
  );
}
