import { Button } from '@oxy.so/bloom/button';
import { BrandScope } from '../../../theme/BrandScope';
import { Link } from '../../../lib/navigation';
import { useTranslation } from '../../../lib/i18n';
import { PARTICIPATION_GUTTER, useParticipationHref } from './shared';

/**
 * Continue the final dark chapter in normal document flow. Deliberately outside
 * the phone/tone selectors: this text never participates in magnetic scrolling.
 */
export default function ParticipationChapter() {
  const { t } = useTranslation();
  const href = useParticipationHref();
  const className = `faircoin-editorial-dark ${PARTICIPATION_GUTTER} relative bg-primary-foreground py-20 text-foreground lg:py-32`;
  return (
    <BrandScope className={className}>
      <section
        id="participation"
        data-static-section-tone="dark"
        aria-labelledby="participation-title"
        className={className}
      >
        <div className="grid gap-10 pt-12 lg:grid-cols-12 lg:gap-6">
          <h2
            id="participation-title"
            className="text-balance text-[length:calc(var(--landing-type)*1.75)] font-normal leading-[1.1] tracking-[-.03em] min-[760px]:text-[length:calc(var(--landing-type)*2)] lg:col-span-6 lg:text-[length:calc(var(--landing-type)*2.5)]"
          >
            {t('faircoinParticipation.title')}
          </h2>
          <div className="space-y-8 lg:col-span-4 lg:col-start-9">
            <p className="text-[length:var(--landing-type)] leading-[1.4] tracking-[-.025em] min-[760px]:text-[length:calc(var(--landing-type)*1.125)]">
              {t('faircoinParticipation.body')}
            </p>
            <p className="text-base leading-relaxed">{t('faircoinParticipation.state')}</p>
            <div className="flex flex-wrap items-start gap-4">
              <Button asChild appearance="solid" size="lg">
                <Link to={href('/participate/')}>{t('faircoinParticipation.propose')}</Link>
              </Button>
              <Button asChild appearance="outline" tone="neutral" size="lg">
                <Link to={href('/pilot/')}>{t('faircoinParticipation.how')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </BrandScope>
  );
}
