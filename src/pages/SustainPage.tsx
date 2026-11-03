import { RiMegaphoneLine } from '@oxy.so/bloom/icons/RiMegaphoneLine';
import { RiMoneyDollarCircleLine } from '@oxy.so/bloom/icons/RiMoneyDollarCircleLine';
import { RiSparklingLine } from '@oxy.so/bloom/icons/RiSparklingLine';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SEO from '../components/SEO';
import Button from '../components/ui/Button';
import DotPattern from '../components/ui/DotPattern';
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection';
import { usePage, type PageSection } from '../api/hooks';
import { sectionContent, sectionHeading, sectionSubheading } from '../lib/cmsSections';
import { AnimatedTitle } from '../components/ui/AnimatedTitle';
import { DashedHLine, DashedVLines } from '../components/ui/GridDecoration';

/* ──────────────────────────────────────────────
 * /sustain
 *
 * Public "we will never ship ads" commitment page. Backed by the CMS
 * `pages/sustain` document. Every section falls back to constant
 * copy when the CMS document is missing or the relevant section
 * hasn't been populated, so the page renders identically on fresh
 * databases.
 *
 * Layout follows the canonical CompanyArticlePage / CompanyPage patterns:
 *   container > > grid grid-cols-12 > col-span-full
 * Dashed rule helpers match CompanyPage.
 * ──────────────────────────────────────────── */

/* ── Fallback copy ── */

const DEFAULT_HERO_BADGE = 'Funding Oxy';
const DEFAULT_HERO_TITLE = "We will never ship ads. Here's how.";
const DEFAULT_HERO_SUBTITLE =
  'Most platforms sell your attention to advertisers. We sell a product worth paying for. This page explains how subscriptions and donations keep Oxy running without compromising your privacy.';

const DEFAULT_WHY_HEADING = 'Why this page exists';
const DEFAULT_WHY_CONTENT =
  'Running a platform that respects your privacy costs real money — servers, bandwidth, engineering, security audits, legal compliance. Most companies cover those costs by selling ads, which means selling your data and your attention. We refuse.\n\nInstead, we ask the people who use Oxy to fund it directly. Subscriptions, donations, and partnerships — money that comes with no strings attached and no incentive to spy on anyone. The goal is simple: reach full sustainability so Oxy can run indefinitely without ever needing ads.';

const DEFAULT_COMMITMENT_HEADING = 'Our commitment';
const DEFAULT_COMMITMENT_SUBHEADING =
  "Six promises that define how we fund Oxy — and what we'll never compromise.";

interface Commitment {
  title: string;
  description: string;
}

const DEFAULT_COMMITMENTS: Commitment[] = [
  {
    title: 'No ads, ever',
    description:
      'We will never show ads in any Oxy product. Not "privacy-friendly" ads, not "contextual" ads, not sponsored content disguised as features. Zero.',
  },
  {
    title: 'No data sales',
    description:
      "Your data is never sold, shared, or used for profiling. Not now, not if we're struggling, not if an acquirer offers. This is non-negotiable.",
  },
  {
    title: 'Full transparency',
    description:
      'We say plainly how Oxy is funded and what it is never funded by. No spin, and no figure we cannot stand behind.',
  },
  {
    title: 'Community-funded',
    description:
      'Every subscriber and donor keeps Oxy independent. No VC pressure to monetize attention, no board pushing for ad revenue.',
  },
  {
    title: 'Open roadmap',
    description:
      'Supporters shape what we build next. The people who fund Oxy get a voice in its direction, not advertisers and not investors.',
  },
  {
    title: 'Sustainable by design',
    description:
      'We optimize for decades, not quarters. Lean operations, boring infrastructure, no growth-at-all-costs. Oxy should outlive its founders.',
  },
];

const DEFAULT_HELP_HEADING = 'How you can help';
const DEFAULT_HELP_CONTENT =
  "Every subscription counts. If you use Oxy and find it valuable, a paid plan is the single most impactful thing you can do. If a plan isn't right for you, a one-time donation helps too. And if money isn't an option, just using Oxy and telling others about it matters more than you think.";

const DEFAULT_CTA_HEADING = 'Keep Oxy ad-free.';
const DEFAULT_CTA_SUBHEADING =
  'Subscribe, donate, or spread the word. Every bit helps us stay independent.';

const DONATE_URL = 'https://opencollective.com/oxy';

/* ── CMS helpers (mirrors CompanyArticlePage) ── */

/**
 * Parse a "commitment" section's items into strongly-typed Commitment objects.
 * Falls back to the provided defaults if the section is missing or its items
 * don't contain at least a title. Items on the server are stored as Mixed so
 * extra fields (`title`, `description`) arrive as `unknown` — narrow them
 * with runtime guards, never with `as any`.
 */
function parseCommitments(sections: PageSection[], fallback: Commitment[]): Commitment[] {
  const section = sections.find((s) => s.type === 'commitment');
  const rawItems = section?.items ?? [];
  const parsed: Commitment[] = [];
  for (const item of rawItems) {
    const title = typeof item.title === 'string' ? item.title : '';
    const description = typeof item.description === 'string' ? item.description : '';
    if (title.length > 0) parsed.push({ title, description });
  }
  return parsed.length > 0 ? parsed : fallback;
}

/* ── Page ── */

export default function SustainPage() {
  const { data: pageData } = usePage('sustain');
  const sections = pageData?.sections ?? [];

  const heroBadge = sectionContent(sections, 'hero', DEFAULT_HERO_BADGE);
  const heroTitle = sectionHeading(sections, 'hero', DEFAULT_HERO_TITLE);
  const heroSubtitle = sectionSubheading(sections, 'hero', DEFAULT_HERO_SUBTITLE);

  const commitmentHeading = sectionHeading(sections, 'commitment', DEFAULT_COMMITMENT_HEADING);
  const commitmentSubheading = sectionSubheading(
    sections,
    'commitment',
    DEFAULT_COMMITMENT_SUBHEADING,
  );
  const commitments = parseCommitments(sections, DEFAULT_COMMITMENTS);

  const whyHeading = sectionHeading(sections, 'why', DEFAULT_WHY_HEADING);
  const whyContent = sectionContent(sections, 'why', DEFAULT_WHY_CONTENT);
  const whyParagraphs = whyContent
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const helpHeading = sectionHeading(sections, 'help', DEFAULT_HELP_HEADING);
  const helpContent = sectionContent(sections, 'help', DEFAULT_HELP_CONTENT);
  const helpParagraphs = helpContent
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const ctaHeading = sectionHeading(sections, 'cta', DEFAULT_CTA_HEADING);
  const ctaSubheading = sectionSubheading(sections, 'cta', DEFAULT_CTA_SUBHEADING);

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Sustain Oxy"
        description="How to support the work: sponsorship, contribution and the programs that keep open infrastructure maintained."
        canonicalPath="/sustain"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div>
            <div className="relative overflow-hidden">
              <DotPattern id="sustain-hero-dots" className="opacity-40 dark:opacity-20" />
              <header className="relative grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
                <div className="col-span-full flex flex-col items-center gap-4 text-center">
                  <div className="mb-6 inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-foreground">
                    {heroBadge}
                  </div>
                  <AnimatedTitle
                    as="h1"
                    className="max-w-[18em] text-balance text-heading-responsive-lg"
                  >
                    {heroTitle}
                  </AnimatedTitle>
                  <p className="mt-4 max-w-2xl text-balance text-lg text-foreground lg:text-xl">
                    {heroSubtitle}
                  </p>
                  <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" responsive href="/one">
                      Subscribe to a plan
                    </Button>
                    <Button
                      variant="outline"
                      responsive
                      href={DONATE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Make a donation
                    </Button>
                  </div>
                </div>
              </header>
            </div>
          </div>
        </section>

        {/* ═══ Why this page exists ═══ */}
        <section className="container">
          <div>
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-span-full py-20 max-lg:py-16">
                <div className="mx-auto max-w-2xl">
                  <h2 className="text-heading-responsive-sm">{whyHeading}</h2>
                  <div className="mt-6 flex flex-col gap-5 text-lg leading-relaxed text-muted-foreground">
                    {whyParagraphs.map((paragraph, idx) => (
                      <p key={idx} className="text-pretty">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ Our commitment ═══ */}
        <section className="container">
          <div>
            <DashedVLines height="h-10" />

            <header className="grid grid-cols-12 pt-20 pb-12 max-lg:pt-16 max-lg:pb-10 justify-items-start">
              <div className="col-span-full max-w-[24em] text-pretty text-heading-responsive-sm text-start mix-blend-multiply dark:mix-blend-screen">
                <h2 className="text-pretty inline">{commitmentHeading}.</h2>{' '}
                <p className="inline text-pretty font-medium text-muted-foreground">
                  {commitmentSubheading}
                </p>
              </div>
            </header>

            <DashedVLines />

            {/* Pixel-gap card grid with diagonal stripe background */}
            <div className="relative grid grid-cols-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-border/30"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
                }}
              />
              <div className="relative col-span-full grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3">
                {commitments.map((commitment, idx) => (
                  <div key={commitment.title} className="bg-background p-8 lg:p-10">
                    <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-4 text-lg font-medium text-foreground">{commitment.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {commitment.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <DashedVLines height="h-21 md:h-40" />
          </div>
        </section>

        {/* ═══ How you can help ═══ */}
        <section className="container">
          <div>
            <DashedHLine />
            <div className="grid grid-cols-12">
              <div className="col-span-full py-20 max-lg:py-16">
                <div className="mx-auto max-w-2xl">
                  <h2 className="text-heading-responsive-sm">{helpHeading}</h2>
                  <div className="mt-6 flex flex-col gap-5 text-lg leading-relaxed text-muted-foreground">
                    {helpParagraphs.map((paragraph, idx) => (
                      <p key={idx} className="text-pretty">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-1 gap-px bg-border p-px sm:grid-cols-3">
                  <div className="flex flex-col bg-background p-8 lg:p-10">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <RiSparklingLine width={24} height={24} fill="currentColor" aria-hidden />
                    </span>
                    <h3 className="mt-6 text-lg font-medium text-foreground">Subscribe</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      Choose a plan that fits. Every subscriber directly funds development and
                      infrastructure.
                    </p>
                    <span className="mt-6 inline-flex">
                      <Button variant="outline" href="/one">
                        View plans
                      </Button>
                    </span>
                  </div>
                  <div className="flex flex-col bg-background p-8 lg:p-10">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <RiMoneyDollarCircleLine
                        width={24}
                        height={24}
                        fill="currentColor"
                        aria-hidden
                      />
                    </span>
                    <h3 className="mt-6 text-lg font-medium text-foreground">Donate</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      One-time or recurring. Every donation keeps Oxy independent.
                    </p>
                    <span className="mt-6 inline-flex">
                      <Button
                        variant="outline"
                        href={DONATE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Donate now
                      </Button>
                    </span>
                  </div>
                  <div className="flex flex-col bg-background p-8 lg:p-10">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <RiMegaphoneLine width={24} height={24} fill="currentColor" aria-hidden />
                    </span>
                    <h3 className="mt-6 text-lg font-medium text-foreground">Spread the word</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      Tell a friend, write about us, or just keep using Oxy. Growth without ads
                      means growth through people.
                    </p>
                    <span className="mt-6 inline-flex">
                      <Button variant="outline" href="/referrals">
                        Referral program
                      </Button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DashedHLine />
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="container">
          <div>
            <DashedVLines height="h-10" />
            <div className="grid grid-cols-12">
              <div className="col-span-full py-20 max-lg:py-16">
                <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
                  <AnimatedTitle
                    as="h2"
                    className="text-balance text-heading-responsive-md"
                  >{`${ctaHeading}.`}</AnimatedTitle>
                  <p className="max-w-xl text-pretty text-muted-foreground">{ctaSubheading}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" responsive href="/one">
                      Subscribe
                    </Button>
                    <Button
                      variant="outline"
                      responsive
                      href={DONATE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Donate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Keep up to date ═══ */}
        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  );
}
