import Button from '../ui/Button';
import IDEDemoMockup from './IDEDemoMockup';
import MissionControlMockup from './MissionControlMockup';
import CodeEditorMockup from './CodeEditorMockup';
import BackgroundTasksMockup from './BackgroundTasksMockup';
import TeamDashboardMockup from './TeamDashboardMockup';

const features = [
  {
    title: 'Built to drive real engineering work',
    description:
      'From routine pull requests to your hardest problems, Codea reliably completes tasks end to end, like building features, complex refactors, migrations, and more.',
  },
  {
    title: 'Designed for multi-agent workflows',
    description:
      'Run multiple agents in parallel, each in its own sandboxed environment. Review diffs, approve changes, and merge, all from one interface.',
  },
  {
    title: 'Adapts to how your team builds',
    description:
      'Codea reads your codebase conventions, respects your linting rules, and follows your architecture patterns automatically.',
  },
  {
    title: 'Made for always-on background work',
    description:
      'Kick off tasks and let them run. Codea works asynchronously and notifies you when results are ready to review.',
  },
  {
    title: 'Raises the bar across your team',
    description:
      'From junior devs to staff engineers, Codea helps everyone ship faster while maintaining quality and consistency.',
  },
];

const platforms = [
  {
    title: 'Start in the Codea app',
    description:
      'Use the full-featured web interface to manage tasks, review diffs, and collaborate with your team in real time.',
  },
  {
    title: 'Launch from CLI',
    description:
      'Run Codea directly from your terminal. Kick off tasks, check progress, and merge results without leaving your workflow.',
  },
  {
    title: 'Build with the API',
    description:
      'Integrate Codea into your CI/CD pipeline, custom tooling, or internal platforms with our developer-friendly API.',
  },
];

export default function CodexExtensionContent() {
  return (
    <>
      {/* ── 1. Hero Section ── */}
      <section className="bg-background relative overflow-hidden">
        {/* Gradient bg */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to bottom, black 0px, black calc(100% - 420px), transparent calc(100% - 80px), transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 0px, black calc(100% - 420px), transparent calc(100% - 80px), transparent 100%)',
          }}
        >
          <div className="h-full w-full bg-gradient-to-b from-muted/30 to-background" />
        </div>

        {/* Hero content */}
        <div className="container relative z-10 flex flex-col items-center pt-12 pb-12 text-center sm:pt-28 sm:pb-16 md:pb-24 lg:pt-16">
          {/* Icon */}
          <div className="flex h-[72px] w-[72px] items-center justify-center bg-transparent sm:h-[78px] sm:w-[78px] md:h-[92px] md:w-[92px]">
            <div className="relative overflow-hidden h-full w-full rounded-[20px] bg-muted" />
          </div>
          <div className="text-foreground text-[clamp(2.5rem,2rem+3vw,4.5rem)] font-semibold leading-none tracking-[-0.03em] mt-7 sm:mt-8 md:mt-10">
            Codea
          </div>
          <p className="text-muted-foreground text-[clamp(1rem,0.9rem+0.3vw,1.125rem)] leading-relaxed mt-5 max-w-4xl text-balance md:mt-6">
            Writes code, fixes bugs, and runs tests in parallel cloud sandboxes. Try with Free and
            Go, or enjoy 2x rate limits on all plans.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-9">
            <div className="flex flex-col gap-3">
              <div className="relative z-10 flex gap-3 flex-row flex-wrap items-center justify-center">
                <Button variant="outline" type="button" className="rounded-full">
                  Download for Windows
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* IDE Demo */}
        <div className="container">
          <div className="relative h-[480px] overflow-hidden rounded-xl sm:h-[500px] lg:h-[720px]">
            <IDEDemoMockup />
          </div>
        </div>
      </section>

      {/* ── 2. Features ── */}
      <section className="mx-auto flex w-full flex-col items-center px-6 pt-20 pb-36 text-center md:px-16 md:pt-24 md:pb-40">
        <div className="text-foreground text-[clamp(1.75rem,1.5rem+1.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
          The best way to build with agents
        </div>
        <div className="mt-16 flex w-full flex-col gap-28 text-start md:mt-20 md:gap-36">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="flex w-full flex-col items-center gap-14 md:flex-row md:items-end md:gap-8 lg:gap-20"
            >
              <div
                className={`flex w-full flex-col items-start md:flex-[0_0_28%] md:justify-end ${i % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}
              >
                <div className="text-foreground text-[clamp(1.25rem,1rem+1vw,1.75rem)] font-semibold leading-snug tracking-[-0.01em] md:max-w-[340px]">
                  {f.title}
                </div>
                <div className="text-muted-foreground text-[clamp(1rem,0.9rem+0.3vw,1.125rem)] leading-relaxed mt-5 md:max-w-[350px]">
                  {f.description}
                </div>
              </div>
              <div
                className={`relative w-full md:max-w-none md:flex-[0_0_72%] lg:h-[520px] ${i % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}
              >
                <div className="h-full w-full rounded-lg overflow-hidden">
                  {i === 0 && <IDEDemoMockup />}
                  {i === 1 && <MissionControlMockup />}
                  {i === 2 && <CodeEditorMockup />}
                  {i === 3 && <BackgroundTasksMockup />}
                  {i === 4 && <TeamDashboardMockup />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. The Same Agent Everywhere ── */}
      <section className="container flex flex-col items-center pb-24 text-center">
        <div className="text-foreground text-[clamp(1.75rem,1.5rem+1.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em] md:text-[40px]">
          The same agent everywhere you code
        </div>
        <div className="text-muted-foreground text-[clamp(1rem,0.9rem+0.3vw,1.125rem)] leading-relaxed mt-5 max-w-3xl">
          Use Codea across multiple surfaces, all connected by your account.
        </div>
        <div className="mt-6 flex justify-center">
          <a
            className="relative inline-flex items-center justify-center text-nowrap transition-colors h-10 rounded-full px-5 text-sm font-medium button-primary"
            href="/developers/docs/"
          >
            Learn more in the developer docs
            <span className="relative top-[0.5px] ms-1">↗</span>
          </a>
        </div>
        <div className="mt-16 grid w-full grid-cols-1 gap-8 text-start md:mt-20 md:grid-cols-3">
          {platforms.map((p) => (
            <div
              key={p.title}
              className="bg-muted/75 flex h-full flex-col overflow-hidden rounded-md p-4 shadow md:p-5"
            >
              <div className="relative -mx-2 -mt-2 w-auto overflow-hidden rounded-lg md:-mx-[10px] md:-mt-[10px] bg-muted aspect-video flex items-center justify-center text-muted-foreground text-xs">
                {p.title}
              </div>
              <div className="text-foreground text-lg font-semibold mt-4">{p.title}</div>
              <p className="text-muted-foreground text-sm mt-2">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Final CTA ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div
            className="h-full w-full overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0px, black 144px, black 256px)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0px, black 144px, black 256px)',
            }}
          >
            <div className="h-full w-full bg-gradient-to-b from-muted/30 to-background" />
          </div>
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-none flex-col items-center justify-between gap-6 px-6 py-20 md:px-10 md:py-24 lg:px-14">
          <div className="text-foreground text-[clamp(1.75rem,1.5rem+1.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
            Try Codea today
          </div>
          <p className="text-muted-foreground text-[clamp(1rem,0.9rem+0.3vw,1.125rem)] leading-relaxed max-w-4xl text-center text-balance">
            Try with Free and Go, or enjoy 2x rate limits on all plans for a limited time.
          </p>
          <div className="w-56">
            <div className="flex flex-col gap-3">
              <div className="relative z-10 flex gap-3 flex-row flex-wrap items-center justify-center">
                <Button variant="outline" type="button" className="w-fit rounded-full">
                  Download for Windows
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
