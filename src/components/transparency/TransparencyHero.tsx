import { RiArrowDownLine } from '@oxy.so/bloom/icons/RiArrowDownLine';
import { RiArrowRightUpLine } from '@oxy.so/bloom/icons/RiArrowRightUpLine';
import Button from '../ui/Button';
import { Link } from '../../lib/navigation';

export interface TransparencyHeroProps {
  titleLines: readonly [string, string];
  introduction: string;
  cornerLead: string;
  cornerText: string;
  featuredDocuments: readonly { path: string; title: string }[];
  actionLabel: string;
}

/** A typographic introduction with quiet document links and an offset action. */
export default function TransparencyHero({
  titleLines,
  introduction,
  cornerLead,
  cornerText,
  featuredDocuments,
  actionLabel,
}: TransparencyHeroProps) {
  return (
    <section
      aria-labelledby="transparency-title"
      className="flex min-h-[100svh] flex-col bg-[color-mix(in_srgb,var(--primary)_4%,var(--background))] text-foreground"
      style={{ paddingTop: 'var(--site-header-occlusion-bottom)' }}
    >
      <div className="container flex flex-1 flex-col pb-10 pt-12 sm:pb-14 sm:pt-16 lg:pt-20">
        <div className="relative">
          <p className="ml-auto max-w-[17rem] text-right text-base leading-relaxed text-muted-foreground lg:absolute lg:right-0 lg:top-0 lg:text-lg">
            <span className="font-medium text-foreground">{cornerLead}</span> {cornerText}
          </p>
        </div>

        <div className="my-14 sm:my-16 lg:mb-20 lg:mt-28">
          <h1
            id="transparency-title"
            className="text-[clamp(2.875rem,7.25vw,7rem)] font-normal leading-[0.98] tracking-[-0.045em]"
          >
            {titleLines[0]} <span className="block">{titleLines[1]}</span>
          </h1>
          <p className="mt-7 max-w-[42rem] text-lg leading-relaxed text-muted-foreground sm:mt-8 sm:text-xl">
            {introduction}
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-9 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <nav
            aria-label="Featured documents"
            className="flex flex-wrap items-center gap-x-7 gap-y-1"
          >
            {featuredDocuments.map(({ path, title }) => (
              <Link
                key={path}
                to={path}
                aria-label={`Read ${title}`}
                className="group inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
              >
                {title}
                <span
                  aria-hidden="true"
                  className="opacity-60 transition-opacity group-hover:opacity-100"
                >
                  <RiArrowRightUpLine width={16} height={16} fill="currentColor" />
                </span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto w-fit shrink-0">
            <Button href="#documents" responsive className="!min-h-12 !px-6 !text-base">
              {actionLabel}
              <RiArrowDownLine width={18} height={18} fill="currentColor" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
