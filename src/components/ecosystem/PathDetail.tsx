import { useEffect, useRef } from 'react';
import type { EcosystemArea } from '../../data/ecosystem/map';
import Button from '../ui/Button';
import ProjectItem from './ProjectItem';

/** The next layer stays in the wheel's hub, or its reading surface on a phone. */
export default function PathDetail({
  area,
  domain,
  onBack,
  mobile = false,
}: {
  area: EcosystemArea;
  domain: string;
  onBack: () => void;
  mobile?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [area.id]);
  return (
    <article
      className={`flex w-full flex-col items-center text-center ${mobile ? 'my-auto gap-5 px-7 py-8 sm:px-16' : 'h-full justify-center gap-4 px-14 py-12'}`}
      aria-labelledby="ecosystem-path-title"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-(--color-sns-grey-1)">{domain}</p>
      <h2
        ref={heading}
        tabIndex={-1}
        id="ecosystem-path-title"
        className="text-3xl leading-tight text-(--color-sns-blue-1) outline-none [font-family:'Horizon_Otto',Georgia,serif] sm:text-4xl"
      >
        {area.name}
      </h2>
      <p className="max-w-[380px] text-sm leading-relaxed text-(--color-sns-grey-1)">
        {area.detail}
      </p>
      {area.projects.length > 0 ? (
        <div className="w-full max-w-[340px] border-t border-(--color-sns-grey-2)/50 pt-4">
          <p className="mb-2 text-[10px] uppercase tracking-[0.13em] text-(--color-sns-grey-1)">
            Connected to this work
          </p>
          <ul className="mx-auto grid w-full max-w-[280px] grid-cols-[repeat(auto-fit,104px)] justify-center gap-4">
            {area.projects.map((project) => (
              <ProjectItem key={project.name} project={project} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs italic text-(--color-sns-grey-1)">
          Part of the future we want to help build.
        </p>
      )}
      <Button type="button" responsive variant="ghost" onClick={onBack}>
        ← Back to {domain}
      </Button>
    </article>
  );
}
