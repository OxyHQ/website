import { Button } from '@oxy.so/bloom/button';
import { Link } from '../../../lib/navigation';
import { useTranslation } from '../../../lib/i18n';
import {
  PARTICIPATION_COPY,
  PARTICIPATION_GUTTER,
  PARTICIPATION_TITLE,
  useParticipationHref,
} from './shared';

/** Public prose only: safe to prerender and index, with no intake request. */
export function ParticipationExplanation({ page }: { page: 'participate' | 'pilot' }) {
  const { t } = useTranslation();
  const href = useParticipationHref();
  if (page === 'participate') {
    return (
      <section className="mx-auto mb-7 max-w-[800px] px-5 text-center lg:mb-10">
        <h1 className="text-balance text-[clamp(36px,5vw,72px)] font-normal leading-[1.08] tracking-[-.015em]">
          {t('faircoinParticipation.participateTitle')}
        </h1>
        <p className="mx-auto mt-4 max-w-[590px] text-balance text-[clamp(16px,1.4vw,21px)] leading-[1.4] text-muted-foreground">
          {t('faircoinParticipation.participateDescription')}
        </p>
      </section>
    );
  }
  return (
    <>
      <section className={`${PARTICIPATION_GUTTER} pb-16 lg:pb-24`}>
        <p className="mb-6 max-w-3xl text-base leading-relaxed">
          {t('faircoinParticipation.state')}
        </p>
        <h1 className={PARTICIPATION_TITLE}>{t(`faircoinParticipation.${page}Title`)}</h1>
        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:gap-6">
          <p className={`${PARTICIPATION_COPY} lg:col-span-6`}>{t('faircoinParticipation.body')}</p>
          <div className="space-y-6 lg:col-span-4 lg:col-start-9">
            <p className="text-base leading-relaxed">{t('faircoinParticipation.noApproval')}</p>
            <Button asChild appearance="outline" tone="neutral" size="lg">
              <Link to={href(page === 'pilot' ? '/participate/' : '/pilot/')}>
                {t(`faircoinParticipation.${page === 'pilot' ? 'propose' : 'how'}`)}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      {page === 'pilot' && (
        <section className={`${PARTICIPATION_GUTTER} pb-20 lg:pb-32`}>
          <h2 className="mb-12 text-balance text-3xl font-normal tracking-tight lg:text-5xl">
            {t('faircoinParticipation.methodTitle')}
          </h2>
          <ol className="grid gap-10 lg:grid-cols-12 lg:gap-6">
            {(['match', 'agree', 'review'] as const).map((step, index) => (
              <li key={step} className="border-t border-border pt-6 lg:col-span-4">
                <span aria-hidden="true" className="text-lg">
                  0{index + 1}
                </span>
                <h3 className="mb-4 mt-8 text-2xl font-normal leading-tight lg:text-3xl">
                  {t(`faircoinParticipation.${step}Title`)}
                </h3>
                <p className="max-w-lg text-lg leading-relaxed">
                  {t(`faircoinParticipation.${step}Body`)}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
