import { RiTeamLine } from '@oxy.so/bloom/icons/RiTeamLine';
import type { EcosystemProject } from '../../data/ecosystem/map';
import { Link } from '../../lib/navigation';

export default function ProjectItem({ project }: { project: EcosystemProject }) {
  const content = (
    <>
      <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card shadow-xs ring-1 ring-foreground/10 transition-transform group-hover:scale-105 motion-reduce:transition-none">
        {project.icon ? (
          project.icon.monochrome ? (
            <span
              aria-hidden="true"
              className="size-9 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
              style={{ maskImage: `url("${project.icon.src}")` }}
            />
          ) : (
            <img
              src={project.icon.src}
              width={64}
              height={64}
              alt=""
              className="size-16 object-contain"
            />
          )
        ) : (
          <RiTeamLine aria-hidden width={36} height={36} fill="currentColor" />
        )}
      </span>
      <span className="w-full text-center text-[13px] font-medium leading-snug">
        {project.name}
        {!project.href && (
          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">Our vision</span>
        )}
      </span>
    </>
  );
  const base = 'group flex h-full w-full flex-col items-center gap-2.5 rounded-2xl px-1 py-2';
  const interactive = `${base} transition-colors hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none`;

  return (
    <li>
      {project.href ? (
        project.href.startsWith('/') ? (
          <Link to={project.href} className={interactive}>
            {content}
          </Link>
        ) : (
          <a href={project.href} className={interactive}>
            {content}
          </a>
        )
      ) : (
        <div className={base}>{content}</div>
      )}
    </li>
  );
}
