import { RiVerifiedBadgeFill } from '@oxy.so/bloom/icons/RiVerifiedBadgeFill';
import type { MentionProfile } from './data';

interface MentionProfileCardProps {
  profile: MentionProfile;
  className?: string;
}

/** Floating profile preview used in the "your unique link" section. */
export default function MentionProfileCard({ profile, className = '' }: MentionProfileCardProps) {
  return (
    <article
      className={`relative w-[270px] rounded-2xl bg-surface p-4 text-left shadow-xl ring-1 ring-border ${className}`}
    >
      <button
        type="button"
        className="absolute right-3 top-3 rounded-full bg-foreground px-3.5 py-1 text-xs font-semibold text-background"
      >
        Follow
      </button>
      <img
        src={profile.avatar}
        alt={profile.name}
        draggable={false}
        className="size-12 rounded-full object-cover"
      />
      <div className="mt-2 flex items-center gap-1">
        <h4 className="text-body-md font-bold text-foreground">{profile.name}</h4>
        <span aria-hidden="true" className="inline-flex text-sky-500">
          <RiVerifiedBadgeFill width={16} height={16} fill="currentColor" />
        </span>
      </div>
      <p className="text-body-sm text-muted-foreground">@{profile.handle}</p>
      <p className="mt-1.5 text-body-xs leading-snug text-muted-foreground">{profile.bio}</p>
      {profile.example ? (
        <p className="mt-2.5">
          <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-body-xs font-medium uppercase tracking-wide text-muted-foreground">
            Example
          </span>
        </p>
      ) : null}
    </article>
  );
}
