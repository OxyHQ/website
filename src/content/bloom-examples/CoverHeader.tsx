import { CoverHeader } from '@oxy.so/bloom/cover-header';

export default function CoverHeaderExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <CoverHeader coverSource="/images/pricing/oxy-one-hero.png" coverHeight={160}>
        <p className="px-4 pb-4 font-semibold">Design together</p>
      </CoverHeader>
    </div>
  );
}
